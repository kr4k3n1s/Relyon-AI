import xml2js from 'xml2js';

export function parseXML(xmlString) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}