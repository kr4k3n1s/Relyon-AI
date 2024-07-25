import axios from "axios";
import { JSDOM } from "jsdom";

export interface GoogleResult {
    url: string,
    title: string,
    rank: number,
}

export class GoogleScraper {

    static BASE_URI = 'https://www.google.com/search?qdr=all&occt=any&lr=lang_en';

    static buildQuery(term: string, limit: number) {
        return `${GoogleScraper.BASE_URI}&q=${encodeURIComponent(term)}&num=${limit}`
    }

   static executeQueryRaw(query: string) {
        return axios.get(query)
             .then(response => response.data)
             .catch(ex => console.log(ex));
    }

    static async executeQueryRawAsync(query: string) {
        return await axios.get(query)
             .then(response => response.data)
             .catch(ex => console.log(ex));
    }

    static executeQuery(query: string) {
        return axios.get(query, {
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
                }
        })
             .then(response => {
                
                const dom = new JSDOM(response.data);
                const document = dom.window.document;
                console.log(response.data);

                var elements = [...document.getElementsByClassName('g')]
                                           .map(elem => elem.getElementsByTagName('a')[0])
                                           .map((source, index) => {
                                                try {
                                                    if(source == undefined) throw new Error('No source available.');
                                                    if(source.getElementsByTagName('h3') == undefined) throw new Error('No heading available.');
                                                    return {title: source.getElementsByTagName('h3')[0]?.innerHTML, url: source.href, rank: index + 1};
                                                } catch(ex){
                                                    console.log(ex);
                                                }
                                           })
                                .filter(item => item != undefined);
                
                return elements;
             })
             .catch(ex => console.log(ex));
    }

}