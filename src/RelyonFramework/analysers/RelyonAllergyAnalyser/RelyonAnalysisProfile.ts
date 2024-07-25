import { compositionTemplate } from "@/promptTemplates/compositionTemplate.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { RelyonFoodReport } from "./RelyonFoodReport.js";

export interface RelyonAnalysisProfile {
    food: string[],
    composition: string[],
    base_ingredients: string[],
    symptoms: string[],

    analysed_food?: RelyonFoodReport[],
}

export class RelyonAnalysisProfile implements RelyonAnalysisProfile {
    
    constructor(food: string[], composition: string[], symptoms: string[], base_ingredients: string[]) {
        this.food = food;
        this.composition = composition;
        this.symptoms = symptoms;
    }

    async runAnalysis() {
        this.analysed_food = await Promise.all(this.food.map(name => RelyonFoodReport.initWithName(name)));
    }

    static async initFromMessage(message: string) {
        const model = new ChatOpenAI({
            model: "gpt-3.5-turbo",
            temperature: 0.25
        });
        const parser = new StringOutputParser();
        const chain = compositionTemplate.pipe(model).pipe(parser);
        const result = await chain.invoke({ text: message });
        return JSON.parse(result) as RelyonAnalysisProfile;
    }
}