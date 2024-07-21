import { RelyonAllergen } from "@/models/RelyonAllergen.js";

export interface RelyonAllergenReport {
    name: string,
    reference?: RelyonAllergen,
    occurence: 'true' | 'false' | 'possible' | 'unknown',
    source: string;
}

export class RelyonAllergenReport implements RelyonAllergenReport {

    constructor(name: string, reference?: RelyonAllergen, occurence: 'true' | 'false' | 'possible' | 'unknown' = 'unknown', source: string = "unknown") {
        this.name = name;
        this.reference = reference;
        this.occurence = occurence;
        this.source = source;
    }
    
}