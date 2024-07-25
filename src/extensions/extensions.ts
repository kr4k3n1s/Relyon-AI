import axios from "axios";
import { htmlToText } from "html-to-text";
import { chromium } from "playwright";

export async function extractFromWeb(searchTerm: string, searchNum: number) {
    try {
        console.log('Q: ' + 'https://customsearch.googleapis.com/customsearch/v?key=AIzaSyD8ngkvG_5oHpuRFDD5WJCwxecgGIEJsVM&cx=e300ce34475bb40ff&num='+searchNum+'&q=' + searchTerm!.replaceAll(' ', '%20'))
        var result = await axios.get('https://customsearch.googleapis.com/customsearch/v1?key=AIzaSyD8ngkvG_5oHpuRFDD5WJCwxecgGIEJsVM&cx=e300ce34475bb40ff&num='+searchNum+'&q=' + searchTerm!.replaceAll(' ', '%20'))
            .then((response) => response.data)
            .catch((error) => console.log(error.message));

        var urls: string[] = result.items.map((item: {link: string}) => item.link);

        return urls.map(async url => {
            try {
                const browser = await chromium.launch();
                const page = await browser.newPage();
                await page.goto(url);
                return {url: url, content: htmlToText(await page.content())};
            } catch(ex) {
                console.log(ex);
            }
        });

    } catch(ex) {
        console.log(ex);
        throw ex;
    }
}