import { stat } from "fs";
import { RelyonAllergenReport } from "./RelyonAllergenReport.js";
import { OFFSourceProcessor } from "@/sources/OpenFoodFacts/OFFSourceProcessor.js";
import { RelyonProcessor } from "@/sources/Relyon/RelyonProcessor.js";

export interface RelyonFoodReport {
    name: string,
    allergens: RelyonAllergenReport[],
    status?: 'intolerant' | 'tolerant' | 'connection',
}

export class RelyonFoodReport implements RelyonFoodReport {

    constructor(name: string, allergens: RelyonAllergenReport[], status?: 'intolerant' | 'tolerant' | 'connection') {
        this.name = name;
        this.allergens = allergens;
        this.status = status;
    }

    static async initWithName(name: string) {
        var offAllergens = (await OFFSourceProcessor.getPossibleAllergens(name))
                .map(partial => new RelyonAllergenReport(partial, undefined, "possible", "OpenFoodFacts"));
        var instanceAllergens = (await RelyonProcessor.getPossibleAllergens(name)).map(partial => new RelyonAllergenReport(partial.name, partial, "possible", (partial.source) ? partial.source : 'RelyonInternal'));
        return new RelyonFoodReport(name, [...offAllergens, ...instanceAllergens]);
    }

}