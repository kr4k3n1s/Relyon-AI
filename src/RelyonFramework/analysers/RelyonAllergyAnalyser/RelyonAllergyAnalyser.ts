import { RelyonAllergen } from "@/RelyonFramework/models/RelyonAllergen.js";
import { compositionTemplate } from "@/promptTemplates/compositionTemplate.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RelyonFoodReport } from "./RelyonFoodReport.js";
import { RelyonAnalysisProfile } from "./RelyonAnalysisProfile.js";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { HumanMessage } from "@langchain/core/messages";
import { analysisTemplate } from "@/promptTemplates/analysisTemplate.js";
import { CHROMA_HOST } from "@/config/constants/config.js";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { response } from "express";

export interface RelyonAllergyAnalyser {
    profile: RelyonAnalysisProfile;
}


export class RelyonAllergyAnalyser {

    // Define the function schema
    static analysisFunctionSchema = {
        name: "allergyAnalysis",
        description: "Process input with all provided sources, analyse and return your analysis to user.",
        parameters: {
            type: "object",
            properties: {
                analysis: {
                    type: "string",
                    description: "A analysis in message format that can be interpreted to the user. Make it quite short just to inform user.",
                },
                index: {
                    type: "array",
                    description: "An analysis index showing which allergy or intolerance can cause issues described by user, related only to sources provided and allergies or intolerances. Order items in this field by probability in decreasing order.",
                    items: {
                        type: "object",
                        properties: {
                            cause: {
                                type: "string",
                                description: "A name of the allergy or intolerance analysed based on the input and provided sources. Only specific allergy or intolerance, NOT any type of general line Food Allergy or Food Intolerance!"
                            },
                            source: {
                                type: "string",
                                description: "An URL to source provided in prompt based on which this allergy or intolerance was identified. If no source identified, this item cannot be included!",
                            },
                            probability: {
                                type: "number",
                                description: "A percentual value of cause probability for identified allergy or intolerance to cause described problems in prompt."
                            },
                            reason: {
                                type: "string",
                                description: "A reasoning description why this allergy or intolerance (disease) was identified as probable cause."
                            },
                            match: {
                                type: "string",
                                description: "A matching sentence or words used to identify this cause based on related source."
                            }
                        },
                        required: ["cause", "source", "probability", "reason"]
                    }
                },
                other_causes: {
                    type: "string",
                    description: "Other possible causes related to user input that can or does not need to be related to allergies or intolerances.",
                },
            },
            required: ["analysis", "index", "other_causes"],
        },
    };

    static queryBreakdownSchema = {
        name: "queryBreakdown",
        description: "Analyse input from the user into 2 categories, what was consumed and what symptoms was caused.",
        parameters: {
            type: "object",
            properties: {
                consumed: {
                    type: "array",
                    description: "An array object of consumed components from analysed user input.",
                    items: {
                        type: "string", 
                        description: "Name of the consumed part in lowercase with nominative form.",
                    }
                },
                symptoms: {
                    type: "array",
                    description: "An array object of symptoms from analysed user input.",
                    items: {
                        type: "string",
                        description: "Name of the symptom caused by any analysed food present in users input",
                    }
                },
                // keywords: {
                //     type: "array",
                //     description: "An array object of keywords analysed from user input.",
                //     items: {
                //         type: "string",
                //         description: "Keyword is an important extraction word from the input that can characterise partial content of the input.",
                //     }
                // },
            },
            required: ["consumed", "symptoms", "keywords"],
        },
    };

    constructor(profile: RelyonAnalysisProfile) {
        this.profile = profile;
    }

    static async initWithMessage(message: string) {
        var profile = await RelyonAnalysisProfile.initFromMessage(message);
        return new RelyonAllergyAnalyser(profile);
    }

    static async init(food: string[], composition: string[], symptoms: string[], base_ingredients: string[]) {
        var profile = new RelyonAnalysisProfile(food, composition, symptoms, base_ingredients);
        await profile.runAnalysis();
        return new RelyonAllergyAnalyser(profile);
    }

    static async getAnalysis(message: string) {
        const embeddings = new OpenAIEmbeddings();
        const vectorStore = new Chroma(embeddings, {
          collectionName: "allergens-knowledge",
          url: CHROMA_HOST,
        });
        
        const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0});
        const parser = new JsonOutputFunctionsParser();

        const response = await vectorStore.similaritySearch(message, 20);
        const functionModel = model.bind({functions: [RelyonAllergyAnalyser.analysisFunctionSchema],
                                     function_call: { name: "allergyAnalysis" }});


        return analysisTemplate.pipe(functionModel).pipe(parser).invoke({ message: message, context: JSON.stringify(response)});
    }

    static async breakdownQuery(query: string) {
        const parser = new JsonOutputFunctionsParser();
        const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.5});
        const functionModel = model.bind({functions: [RelyonAllergyAnalyser.queryBreakdownSchema],
            function_call: { name: "queryBreakdown" }});
        var result = await functionModel.pipe(parser).invoke(query);

        result['origin_query'] = query;
        return result;
    }

}