import { HOST } from "@/constants/config.js";
import { RelyonAllergen } from "@/models/RelyonAllergen.js";
import axios, { AxiosError } from "axios";

export class RelyonProcessor {


    static async getPossibleAllergens(item: string) {
        return await axios.get(HOST + '/allergen/list/connection?connection='+item)
          .then((response) => {
            return response.data.result as RelyonAllergen[];
          })
          .catch((error) => {
            console.log('[ERROR]: Insert of Allergens failed!')
            throw new Error(((error as AxiosError).response!.data as any).result)
          });
    }

}