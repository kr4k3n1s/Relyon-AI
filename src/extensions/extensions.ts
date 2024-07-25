import { SERP_HOST } from "@/config/constants/config.js";
import axios from "axios";

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

export async function extractFromUrls(urls: string[]) {
    try {
        return urls.map(async url => {
            try {
                const data = await axios.get(url)
                                        .then(response => response.data)
                                        .catch(error => console.log(error.message));
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


const HTMLPartToTextPart = (HTMLPart) => (
    HTMLPart
      .replace(/\n/ig, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/ig, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head[^>]*>/ig, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/ig, '')
      .replace(/<\/\s*(?:p|div)>/ig, '\n')
      .replace(/<br[^>]*\/?>/ig, '\n')
      .replace(/<[^>]*>/ig, '')
      .replace('&nbsp;', ' ')
      .replace(/[^\S\r\n][^\S\r\n]+/ig, ' ')
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