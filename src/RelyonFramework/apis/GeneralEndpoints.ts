import { RelyonAllergyAnalyser } from '@/RelyonFramework/analysers/RelyonAllergyAnalyser/RelyonAllergyAnalyser.js';
import { RelyonAllergen } from '@/RelyonFramework/models/RelyonAllergen.js';
import { MedlineSourceProcessor } from '@/sources/MedLine/MedlineSourceProcessor.js';
import { OFFSourceProcessor } from '@/sources/OpenFoodFacts/OFFSourceProcessor.js';
import { Router } from 'express';
import multer from 'multer';
import { chromium } from 'playwright';
import { htmlToText } from 'html-to-text';
import { extractFromUrls, extractFromWebRaw } from '@/extensions/extensions.js';
import { GoogleScraper } from '../scraper/GoogleScraper.js';
import { CHROMA_HOST } from '@/config/constants/config.js';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { env } from 'process';
import axios from 'axios';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/dev/database/search', async (req, res) => {

    var queries = req.body.queries as string[];

    // const embeddings = new OpenAIEmbeddings();
    const embeddingFunction = new OpenAIEmbeddingFunction({openai_api_key: env.OPENAI_API_KEY});
    const client = new ChromaClient();

    // const vectorStore = new Chroma(embeddings, {
    //     collectionName: "allergens-knowledge",
    //     url: CHROMA_HOST,
    //     collectionMetadata: { "hnsw:space": "cosine" }
    // });

    const collection = await client.getCollection({
        name:"allergens-knowledge",
        embeddingFunction: embeddingFunction
    })
    
    // const retriever = vectorStore.asRetriever({k: 25});
    // const response = await retriever.invoke(message);

    // var collection = await vectorStore.ensureCollection();
    console.log('Retrieving...')
    const response = await collection.query({ queryTexts: queries, nResults: 25})
    // const response = await vectorStore.similaritySearchWithScore(message, 25);
    return res.json(response);
});

router.post('/dev/analyser/query', async (req, res) => {
    var message = req.body.message as string;

    var response = await RelyonAllergyAnalyser.breakdownQuery(message);
    res.json(response);

    // res.json({
    //     analysis: responses[0].analysis,
    //     index: responses.map(response => response.index).flat().filter((obj1, i, arr) => arr.findIndex(obj2 => (obj2.cause.toLowerCase() === obj1.cause.toLowerCase())) === i),
    //     other_causes: responses.map(response => response.other_causes)
    // });
});

router.get('/dev/analyser/analyse', async (req, res) => {
    var message = req.query.message as string;

    var responsePromises = Array(5).fill(0).map((_, i) => RelyonAllergyAnalyser.getAnalysis(message));
    var responses = await Promise.all(responsePromises);

    res.json({
        analysis: responses[0].analysis,
        index: responses.map(response => response.index).flat().filter((obj1, i, arr) => arr.findIndex(obj2 => (obj2.cause.toLowerCase() === obj1.cause.toLowerCase())) === i),
        other_causes: responses.map(response => response.other_causes)
    });
});

router.get('/dev/analyser/get/value', upload.single('fileContent'), async (req, res) => {
    var message = req.query.term as string;

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = new Chroma(embeddings, {
        collectionName: "allergens-knowledge",
        url: CHROMA_HOST,
    });

    const response = await vectorStore.similaritySearch(message, 30);
    res.json(response);
})

// Handle POST request to /upload
router.post('/dev/extractor/list/upload', upload.single('fileContent'), async (req, res) => {

    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    const fileContent = req.file.buffer.toString('utf8');
    const parsed: {urls: {title: string, url: string, rank: number}[], data: {url: string, content: string}[]} = JSON.parse(fileContent);

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = new Chroma(embeddings, {
        collectionName: "allergens-knowledge-new",
        url: CHROMA_HOST,
    });

    var docs = (await Promise.all(parsed.data.map(async (obj: { content: string; url: any; }, index) => {
        if(obj == null) return undefined;
        const textSplitter = new CharacterTextSplitter({chunkSize: 800, chunkOverlap: 300, separator: '. '});

        const splits = await textSplitter.splitText(obj.content);

        return splits.map(split => {
            if(split == null || split == undefined) return undefined
            return {
                pageContent: split,
                metadata: {
                    source: obj.url,
                }
            }
        }).filter(item => item != undefined);
    }))).filter(item => item != undefined);


    // Also supports an additional {ids: []} parameter for upsertion
    // const ids = await vectorStore.addDocuments(docs);

    // // const retriever = vectorStore.asRetriever(5);
    // const response = await vectorStore.similaritySearch(message, 10);
    var ids: string[] = []
    for(var documents of docs) {
        ids = [...ids, ...(await vectorStore.addDocuments(documents))];
    }

    res.json(ids.length);
});

router.post('/dev/extractor/test', async (req, res) => {
    var url = req.query.url as string;

    var result = await axios.get(url, {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
        }
    }).then(res => res.data).catch(err => err)
    res.json(result);
})

router.post('/dev/extractor/list/results', async (req, res) => {
    req.setTimeout(500000);
    
    var items = req.body.items;
    var resultURLs: Promise<void | { title: string | undefined; url: string; }[]>[] = [];
    items.map((item: string) => resultURLs = [...resultURLs, GoogleScraper.executeQuery(GoogleScraper.buildQuery(item, 5))]);

    var urls = (await Promise.all(resultURLs)).flat().filter(item => item != undefined);
    console.log('URLS: ' + urls);
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