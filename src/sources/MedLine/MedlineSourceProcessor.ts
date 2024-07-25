import { CHROMA_HOST } from "@/config/constants/config.js";
import { analysisTemplate } from "@/promptTemplates/analysisTemplate.js";
import { compositionTemplate } from "@/promptTemplates/compositionTemplate.js";
import { inquiryTemplate } from "@/promptTemplates/inquiryTemplate.js";
import { parseXML } from "@/utils/Utils.js";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import axios from "axios";

interface MedlineData {
    source: string,
    title: string,
    data: string
}

export class MedlineSourceProcessor {

    static baseURI = 'https://wsearch.nlm.nih.gov/ws/query';
    rawData: any;
    parsedData: MedlineData[] = [];

    async buildInquiry(question: string) {
        const model = new ChatOpenAI({
          model: "gpt-4o-mini",
          temperature: 0
        });
        const parser = new StringOutputParser();
        const chain = inquiryTemplate.pipe(model).pipe(parser);
        var result = await chain.invoke({ text: question});
        
        return result.replaceAll(' ', '-');
    }

    async fetchData(term: string, db: string = 'healthTopics') {
        console.log(term);
        var uri = MedlineSourceProcessor.baseURI + '?db='+db+'&term=' + encodeURIComponent('term='+term) + '&retstart=0'; 
        console.log(uri);

        var result = await axios({url: uri, method: "get"})
            .then((response) => { return response.data; })
            .catch((error) => { console.log('Error: ' + error.message); });

        var parsed = await parseXML(result)
            .then(result => { return result })
            .catch(error => { console.error('Error parsing XML:', error); });

        this.rawData = parsed;
        return this;
    }

    async parseRawData(data: any = this.rawData): Promise<this> {
        var rawData = data.nlmSearchResult;

        if(rawData.list == undefined) return this;
      
        var objects: {source: string, title: string, data: string}[] = rawData.list[0].document.map((doc) => {
          return {
            source: doc['$'].url, 
            title: (doc.content as any[]).find(val => val['$'].name == 'title')["_"],
            data: (doc.content as any[]).find(val => val['$'].name == 'FullSummary')['_']
          };
        });

        this.parsedData = objects;
        return this;
    }

    async parseToDocuments(data: MedlineData[] = this.parsedData) {
        var docs: any[] = [];
        for(var obj of data) {
          const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 2000, chunkOverlap: 600});
          const splits = await textSplitter.splitText(obj.data);
          
          for(var split of splits) {
            var object = {
              pageContent: split,
              metadata: {
                source: obj.source,
                title: obj.title
              }
            }
            docs.push(object)
          }
        }

        return docs;
    }

    static async getAnalysis(message: string | undefined) {
        if(message == undefined) throw new Error("User's input is empty, nothing to analyse")
        const embeddings = new OpenAIEmbeddings();
        const vectorStore = new Chroma(embeddings, {
          collectionName: "test-knowledge",
          url: CHROMA_HOST,
        });

        // const inquiry = 'digestion+OR+stomach-pain+OR+milk';
        var processor = new MedlineSourceProcessor();
        const inquiry = await processor.buildInquiry(message);
        console.log('INQUIRY: ' + inquiry);
        const documents = await (await (await processor.fetchData(inquiry)).parseRawData()).parseToDocuments();
        // const ids = await vectorStore.addDocuments(documents);
        console.log(documents);
      
        // Also supports an additional {ids: []} parameter for upsertion
        const ids = await vectorStore.addDocuments(documents);
      
        // const retriever = vectorStore.asRetriever(5);
        const response = await vectorStore.similaritySearch(message, 10);
        console.log(response);

        const model = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0
        });
        const parser = new StringOutputParser();
        const chain = analysisTemplate.pipe(model).pipe(parser);
        var result = await chain.invoke({ message: message, context: JSON.stringify(response)});
        
        return result;
      }

    static async getFoodFromUser(question: string) {
      const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0
      });
      const parser = new StringOutputParser();
      const chain = compositionTemplate.pipe(model).pipe(parser);
      var result = await chain.invoke({ text: question});
      
      return result;
    }

}