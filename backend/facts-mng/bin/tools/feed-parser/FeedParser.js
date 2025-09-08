"use strict";
//var FeedParser = require("feedparser");
var fetch = require("node-fetch");
const { from } = require("rxjs");
const { mergeMap, tap, catchError } = require("rxjs/operators");

class FeedParserClass {
  static getImportSharkAttacks$(feed) {
    return from(fetch(feed)).pipe(
      mergeMap((res) => res.json()),
      mergeMap((data) => from(data.results))
    );
  }

  static getSharkAttackDetailByCountry$(country) {
    const https = require('https');
    
    const mappedCountry = country.toUpperCase();
    const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/global-shark-attack/records?where=country%3D%27${encodeURIComponent(mappedCountry)}%27&limit=5`;
    console.log('DEBUG - FeedParser URL:', url);
    console.log('DEBUG - Original country:', country, '-> Mapped country:', mappedCountry);
    
    return from(new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        console.log('DEBUG - Response status:', res.statusCode);
        
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('DEBUG - API response:', JSON.stringify(response, null, 2));
            const results = response.results || [];
            console.log('DEBUG - Results count:', results.length);
            resolve(results);
          } catch (error) {
            console.error('ERROR parsing JSON:', error);
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('ERROR in HTTPS request:', error);
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    })).pipe(
      mergeMap((results) => from(results)),
      catchError((error) => {
        console.error('ERROR in getSharkAttackDetailByCountry$:', error);
        return from([]);
      })
    );
  }

  static parseFeed$(feed) {
    return this.getImportSharkAttacks$(feed);
  }
}

/**
 * @returns {FeedParserClass}
 */
module.exports = FeedParserClass;