import { RelyonAllergyAnalyser } from '@/RelyonFramework/analysers/RelyonAllergyAnalyser/RelyonAllergyAnalyser.js';
import { RelyonAllergen } from '@/RelyonFramework/models/RelyonAllergen.js';
import { MedlineSourceProcessor } from '@/sources/MedLine/MedlineSourceProcessor.js';
import { OFFSourceProcessor } from '@/sources/OpenFoodFacts/OFFSourceProcessor.js';
import { Router } from 'express';
import multer from 'multer';
import { chromium } from 'playwright';
import { htmlToText } from 'html-to-text';
import axios, { AxiosError } from 'axios';
import { extractFromUrls, extractFromWebRaw, getUrlsForTerm } from '@/extensions/extensions.js';
import { GoogleScraper } from '../scraper/GoogleScraper.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/dev/extractor/list/results', async (req, res) => {
    var items = req.body.items;


    var resultURLs: Promise<void | { title: string | undefined; url: string; }[]>[] = [];
    items.map((item: string) => resultURLs = [...resultURLs, GoogleScraper.executeQuery(GoogleScraper.buildQuery(item, 5))]);

    var urls = (await Promise.all(resultURLs)).flat().filter(item => item != undefined);
    var googleResults = await Promise.all(extractFromUrls(urls.map((result) => result.url)));

    res.json({status: 'fetched', urls: urls, data: googleResults});
});

router.get('/dev/extractor/get/results', async (req, res) => {

    var searchTerm: string = req.query.search as any;
    var searchNum: number = req.query.num as any ?? 10;
    var executions = await extractFromWebRaw(searchTerm, searchNum)

    var complete = await Promise.all(executions);
    
    res.send(complete);
});

router.get('/dev/extractor/web', async (req, res) => {

    var url: string = req.query.url as any;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.healthline.com/health/allergies/tomatoes-recipes');
    const title = await page.content();
    
    res.send(htmlToText(title));
    await browser.close();
});

router.post('/dev/analysers/allergy_analyser/process', async (req, res) => {
    console.log(JSON.stringify(req.body));
    var analyser = req.body as RelyonAllergyAnalyser;
    res.json(analyser.profile.analysed_food?.map(food => ({ 'food': food.name, 'allergens': food.allergens.map(allergen => allergen.name), diseases: food.allergens.filter(allergen => allergen.reference != undefined).map(allergen => allergen.reference?.diseases).flat(), connected: food.allergens.filter(allergen => allergen.reference != undefined).map(allergen => allergen.reference?.connected).flat() })))
});

router.get('/analyse', async (req, res) => {
    var message = req.query.message as string;
    var response = await MedlineSourceProcessor.getAnalysis(message);
    res.send(response);
});

router.get('/analysers/allergy_analyser/get/profile', async (req, res) => {
    var message = req.query.message as string;
    var response = await RelyonAllergyAnalyser.initWithMessage(message);
    res.send(response);
});

router.post('/dev/analysers/allergy_analyser/get/profile', async (req, res) => {
    console.log(JSON.stringify(req.body));
    var analyser = JSON.parse(JSON.stringify(req.body)) as RelyonAllergyAnalyser;
    var response = await RelyonAllergyAnalyser.init(analyser.profile.food, analyser.profile.composition, analyser.profile.symptoms, analyser.profile.base_ingredients);
    res.send(response);
});

router.get('/allergens', async (req, res) => {
    var message = req.query.message as string;
    var response = await OFFSourceProcessor.getPossibleAllergens(message);
    res.send(response);
});

router.get('/traces', async (req, res) => {
    var message = req.query.message as string;
    var response = await OFFSourceProcessor.getPossibleTraces(message);
    res.send(response);
});

// Handle POST request to /upload
router.post('/uploadCSVAllergens', upload.single('fileContent'), async (req, res) => {

    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    const fileContent = req.file.buffer.toString('utf8');
    var rowData = fileContent.split('\n');

    rowData = rowData.filter((data, index) => {
        if (index == 0) return false;
        var rowData = data.split(',');
        if (rowData[2] == 'Unassigned' || rowData[2] == '' || rowData[1] == '') return false;
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
    for (const allergen of allergens) {
        try {
            insertedAllergens.push(await allergen.insertToDatabase());
        } catch (error) {
            console.log((error as Error).message);
        }
    }

    console.log('[INFO:] ' + insertedAllergens.length + ' allergens inserted successfully!');
    res.status(200).json({ inserted: insertedAllergens.length, allergens: insertedAllergens });
});


export default router;