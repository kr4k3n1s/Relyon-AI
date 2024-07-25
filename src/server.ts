import "dotenv/config"
import express from "express";
import bodyParser from 'body-parser';
import { RelyonAPI } from "./RelyonFramework/core/RelyonCore.js";

const app = express();
const port = 3000;

// Use body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


const RelyonApiRunner = new RelyonAPI(app);
RelyonApiRunner.attachServices();
