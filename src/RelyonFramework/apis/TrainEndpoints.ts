import { RelyonAllergyAnalyser } from '@/RelyonFramework/analysers/RelyonAllergyAnalyser/RelyonAllergyAnalyser.js';
import { RelyonAllergen } from '@/RelyonFramework/models/RelyonAllergen.js';
import { MedlineSourceProcessor } from '@/sources/MedLine/MedlineSourceProcessor.js';
import { OFFSourceProcessor } from '@/sources/OpenFoodFacts/OFFSourceProcessor.js';
import { Router } from 'express';
import multer from 'multer';
import { chromium } from 'playwright';
import { htmlToText } from 'html-to-text';
import axios, { AxiosError } from 'axios';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// router.post('/dev/extractor/list/results', async (req, res) => {
//     var items = req.body.items;

//     var googleResults: (Promise<Promise<{ url: string; content: string; } | undefined>[]>)[] = [];
//     items.map((item: string) => googleResults = [...googleResults, extractFromWeb(item, 5)])

//     var extractions = (await Promise.all(googleResults)).flat();
//     var results = await Promise.all(extractions);

//     res.json({status: 'fetched', data: results});
// });

export default router;