import { HOST } from "@/config/constants/config.js";
import axios, { AxiosError } from "axios";

export interface RelyonAllergen {
    _id?: string;
    name: string;
    icon?: string;
    iconURL?: string;
    lowercase: string;
    preDefined: boolean;
    author?: string;
    status?: 'intolerant' | 'tolerant' | 'connection';
    connected?: string[];
    diseases?: string[];
    source?: string;
}

export class RelyonAllergen implements RelyonAllergen {

    constructor(name: string, lowercase: string, preDefined: boolean, id?: string, author?: string, source?: string){
        this._id = id;
        this.name = name;
        this.lowercase = lowercase;
        this.preDefined = preDefined;
        this.author = author;
        this.source = source;
    }

    addConnection(item: string | string[]) {
        if(!this.connected) this.connected = [];
        if(typeof item == 'string') this.connected.push(item);
        else this.connected = [...this.connected, ...item];
    }

    async insertToDatabase() {

        var result = await axios.post(HOST + '/addAllergen', this)
          .then((response) => {
            console.log('[INSERT]: Allergen with ID: ' + response.data.id + ', successfuly inserted!');
            this._id = response.data.id;
            return this;
          })
          .catch((error) => {
            console.log('[ERROR]: Insert of Allergens failed!')
            throw new Error(((error as AxiosError).response!.data as any).result)
          });

        return this;

    }

}