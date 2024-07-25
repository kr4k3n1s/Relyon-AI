import { OFFExtended } from "@/sources/OpenFoodFacts/OpenFoodDataEXT.js";

export class OFFSourceProcessor {

    static baseURI = 'https://world.openfoodfacts.net/api/v2/search';

    static async getPossibleAllergens(forItem: string) {
        console.log('Getting allergens for: ' + forItem);
        var OFFSource = new OFFExtended();
        var products = await OFFSource.getProducts(forItem, 'allergens');
        console.log('Got ' + products.length + ' products!');
        return Array.from(new Set(products.map((val) => val['allergens'].split(',')).flat().filter(val => val != undefined && val.split(':')[0] == "en").map(val => val.split(":")[1])));
    }

    static async getPossibleTraces(forItem: string) {
        var OFFSource = new OFFExtended();
        var products = await OFFSource.getProducts(forItem, 'traces');
        return Array.from(new Set(products.map((val) => val['traces'].split(',')).flat().filter(val => val != undefined && val.split(':')[0] == "en").map(val => val.split(":")[1])));
    }

}