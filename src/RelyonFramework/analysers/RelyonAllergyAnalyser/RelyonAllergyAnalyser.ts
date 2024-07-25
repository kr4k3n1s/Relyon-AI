import { RelyonAllergen } from "@/RelyonFramework/models/RelyonAllergen.js";
import { compositionTemplate } from "@/promptTemplates/compositionTemplate.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { RelyonFoodReport } from "./RelyonFoodReport.js";
import { RelyonAnalysisProfile } from "./RelyonAnalysisProfile.js";

export interface RelyonAllergyAnalyser {
    profile: RelyonAnalysisProfile;
}

export class RelyonAllergyAnalyser {

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

}