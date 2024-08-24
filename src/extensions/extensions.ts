import { SERP_HOST } from "@/config/constants/config.js";
import axios, { AxiosResponse } from "axios";
import { response } from "express";
import pdf from 'pdf-parse';
import jsdom from "jsdom";
const { JSDOM } = jsdom;

// export async function extractFromWeb(searchTerm: string, searchNum: number) {
//     try {
//         console.log('Q: ' + 'https://customsearch.googleapis.com/customsearch/v?key=AIzaSyD8ngkvG_5oHpuRFDD5WJCwxecgGIEJsVM&cx=e300ce34475bb40ff&num='+searchNum+'&q=' + searchTerm!.replaceAll(' ', '%20'))
//         var result = await axios.get('https://customsearch.googleapis.com/customsearch/v1?key=AIzaSyD8ngkvG_5oHpuRFDD5WJCwxecgGIEJsVM&cx=e300ce34475bb40ff&num='+searchNum+'&q=' + searchTerm!.replaceAll(' ', '%20'))
//             .then((response) => response.data)
//             .catch((error) => console.log(error));

//         var urls: string[] = result.items.map((item: {link: string}) => item.link);

//         return urls.map(async url => {
//             try {
//                 const data = await axios.get(url)
//                                         .then(response => response.data)
//                                         .catch(error => console.log(error.message));
//                 return {url: url, content: HTMLPartToTextPart(data)};
//             } catch(ex) {
//                 console.log(ex);
//             }
//         });

//     } catch(ex) {
//         console.log(ex);
//         throw ex;
//     }
// }

export async function getUrlsForTerm(searchTerm: string, searchNum: number) {
    var query = SERP_HOST+'/google/search?lang=EN&limit='+searchNum+'&text='+searchTerm;
    console.log('Q: ' + query)
    var result: Promise<any[]> = axios.get(query)
        .then((response) => response.data)
        .catch((error) => console.log(error));

    return result;
}

async function scraper(response: AxiosResponse<any, any>, url) {
    return ((response.headers.getContentType as any)().toString().includes('pdf')) 
                ? await scrapePDF(url) 
                : response.data;
}

function decodeHtmlEntities(content) {
    var document = new JSDOM('').window.document;
    // Create a temporary DOM element to parse HTML entities
    const textArea = document.createElement('textarea');
    
    // Function to decode HTML entities
    function decodeHTMLEntities(str) {
        // Assign the string to the textarea element's innerHTML
        textArea.innerHTML = str;
        // The browser will automatically decode the entities
        return textArea.value;
    }

    // Clean up and decode all entities
    content = decodeHTMLEntities(content);

    // Replace newline characters with space
    content = content.replace(/(\r\n|\n|\r)/gm, " ");

    // Replace multiple spaces with a single space
    content = content.replace(/\s\s+/g, ' ');

    // Trim leading and trailing spaces
    content = content.trim();

    return content;
}

export function extractFromUrls(urls: string[]) {
    try {
        return urls.map(async url => {
            try {
                const data = (url.indexOf(".pdf") == -1) 
                                ? await axios.get(url)
                                             .then(async (response) => await scraper(response, url))
                                             .catch(error => console.log(error.message))
                                : await scrapePDF(url);

                return {url: url, content: HTMLPartToTextPart(data)};
            } catch(ex) {
                console.log(ex);
            }
        });

    } catch(ex) {
        console.log(ex);
        throw ex;
    }
}

export async function scrapePDF(url: string) {
    return await axios({ method: 'GET', url, responseType: 'arraybuffer'}).then(async result => {
        const buffer = result.data;
        
        return await pdf(buffer).then(data => data.text)
                                .catch(err => { throw err; });
    }).catch(err => { throw err; });
}


const HTMLPartToTextPart = (HTMLPart) => (
      decodeHtmlEntities(HTMLPart
        .replace(/\n/ig, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/ig, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head[^>]*>/ig, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/ig, '')
        .replace(/<\/\s*(?:p|div)>/ig, '\n')
        .replace(/<br[^>]*\/?>/ig, '\n')
        .replace(/<[^>]*>/ig, '')
        .replace('&nbsp;', ' ')
        .replace(/[^\S\r\n][^\S\r\n]+/ig, ' '))
        .replace('\t', '    ')
  );

export async function extractFromWebRaw(searchTerm: string, searchNum: number) {
    try {
        var query = SERP_HOST+'/google/search?lang=EN&limit='+searchNum+'&text='+searchTerm;
        console.log('Q: ' + query)
        var result = await axios.get(query)
            .then((response) => response.data)
            .catch((error) => console.log(error));

        console.log(result);

        var urls: string[] = result.map((item: {url: string}) => item.url);

        return urls.map(async url => {
            const data = await axios.get(url)
                                    .then(response => response.data)
                                    .catch(error => console.log(error.message));
            return {url: url, content: HTMLPartToTextPart(data)};
        });

    } catch(ex) {
        console.log(ex);
        throw ex;
    }
}