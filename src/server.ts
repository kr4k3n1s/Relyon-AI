import "dotenv/config"
import express from "express";
import { MedlineSourceProcessor } from "./sources/medline/MedlineSourceProcessor.js";
import { OFFSourceProcessor } from "./sources/openFoodFacts/OFFSourceProcessor.js";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import { RelyonAllergen } from "./models/RelyonAllergen.js";
import { RelyonAllergyAnalyser } from "./analysers/RelyonAllergyAnalyser/RelyonAllergyAnalyser.js";

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Use body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/analyse', async (req, res) => {
  var message = req.query.message as string;
  var response = await MedlineSourceProcessor.getAnalysis(message);
  res.send(response);
});

app.get('/analysers/allergy_analyser/get/profile', async (req, res) => {
  var message = req.query.message as string;
  var response = await RelyonAllergyAnalyser.initWithMessage(message);
  res.send(response);
});

app.post('/dev/analysers/allergy_analyser/get/profile', async (req, res) => {
  console.log(JSON.stringify(req.body));
  var analyser = JSON.parse(JSON.stringify(req.body)) as RelyonAllergyAnalyser;
  var response = await RelyonAllergyAnalyser.init(analyser.profile.food, analyser.profile.composition, analyser.profile.symptoms);
  res.send(response);
});

app.get('/allergens', async (req, res) => {
  var message = req.query.message as string;
  var response = await OFFSourceProcessor.getPossibleAllergens(message);
  res.send(response);
});

app.get('/traces', async (req, res) => {
  var message = req.query.message as string;
  var response = await OFFSourceProcessor.getPossibleTraces(message);
  res.send(response);
});

// Handle POST request to /upload
app.post('/uploadCSVAllergens', upload.single('fileContent'), async (req, res) => {

  if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).send('No file uploaded');
  }

  const fileContent = req.file.buffer.toString('utf8');
  var rowData = fileContent.split('\n');
  
  rowData = rowData.filter((data, index) => {
    if(index == 0) return false;
    var rowData = data.split(',');
    if(rowData[2] == 'Unassigned' || rowData[2] == '' || rowData[1] == '') return false;
    else return true;
  })

  var allergens = rowData.map((data) => {
    var specificData = data.split(',');
    var allergen = new RelyonAllergen(specificData[2]!, specificData[2]!.toLowerCase(), true, undefined, undefined, 'allergenonline.org');
    allergen.addConnection(specificData[1]!);

    return allergen;
  });

  
  console.log('[INFO:] Inserting new allergens...');

  var insertedAllergens: RelyonAllergen[] = [];
  for(const allergen of allergens) {
    try {
      insertedAllergens.push(await allergen.insertToDatabase());
    } catch(error) {
      console.log((error as Error).message);
    }
  }

  console.log('[INFO:] ' + insertedAllergens.length + ' allergens inserted successfully!');
  res.status(200).json({inserted: insertedAllergens.length, allergens: insertedAllergens});
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});