import { QueryParameter, QueryObject } from "@/RelyonFramework/core/RelyonCore.js";

const defaultOptions = {
  country: 'world',
  env: 'DEV'
}

/**
 * @constant Default query options for OpenFoodFacts API requests.
 * 
 * @property {object[]} params - Array of default query parameters.
 * @property {string} baseURL - The base URL for API requests, using the country specified in defaultOptions.
 */
const defaultQueryOptions = {
  params: [{key: 'json', value: 'true'}, {key: 'action', value: 'process'}],
  baseURL: `https://${defaultOptions.country}.openfoodfacts.org`,
}

/**
 * An array of query parameters used for filtering products by completeness.
 * When these parameters are added to a product query, only products with a
 * "complete" state will be returned.
 *
 * @type {QueryParameter[]}
 */
const completness: QueryParameter[] = [
  { key: 'tagtype_0', value: 'states' },
  { key: 'tag_contains_0', value: 'contains' },
  { key: 'tag_0', value: 'complete' }
];

/**
 * @interface OFFExtended is representing trasformation handler object from the OpenFoodFacts API source.
 * @property {any} options - The options to be used when interacting with the TheMealDB API.
 * @property {string} URL - The base URL for the TheMealDB API.
 */
export interface OFFExtended {
  options: any;
  URL: string;
}

export class OFFExtended {

    constructor (options = defaultOptions) {
      this.options = options
      this.URL = `https://${options.country}.openfoodfacts.org`
    }

    /**
   * Asynchronously retrieves popular products with optional filters and pagination.
   * This function can be customized with various parameters to filter the results, sort them,
   * paginate the results, or retrieve only complete product records.
   *
   * @param {string} [fields] - Optional fields to retrieve for each product.
   * @param {{currentPage: number, step: number}} [paginate] - Optional pagination parameters, including current page and step size.
   * @param {{byField: string, order: string}} [sort] - Optional sorting parameters, including the field to sort by and the order (ascending or descending).
   * @param {boolean} [onlyComplete=false] - Optional flag to retrieve only complete product records.
   * @returns {Promise<object>} A Promise that resolves to the retrieved products as an object.
   */
    async getPopularProducts( fields?: string, paginate?: {currentPage: number, step: number}, sort?: {byField: string, order: string}, onlyComplete?: boolean): Promise<object> {
      var params: QueryParameter[] = [
        { key: 'action', value: 'process' },
        { key: 'fields', value: fields },
        { key: 'json', value: true },
        sort ? { key: 'sort_by', value: sort.byField} : {key: 'sort_by', value: ''},
      ] 
      if(onlyComplete) params.push(...completness);

      var productQuery = paginate ? new QueryObject('cgi/search.pl', params, defaultQueryOptions.baseURL).paginate(paginate.currentPage, paginate.step) 
                                  : new QueryObject('cgi/search.pl', params, defaultQueryOptions.baseURL);

      var response = await productQuery.query();
      return JSON.parse(response);
    }

    /**
   * Searches for products based on the provided searchWord and other optional filters.
   * This function constructs a QueryObject with the searchWord, fields, and other parameters.
   * It supports additional options like pagination, sorting, and filtering products based on their completeness.
   * After executing the query, the function returns a JSON-parsed response containing the list of fetched products.
   *
   * @param {string} searchWord - The keyword to search for in the products.
   * @param {string} [fields] - Optional comma-separated list of fields to return for each product.
   * @param {{currentPage: number, step: number}} [paginate] - Optional pagination object with current page and step.
   * @param {{byField: string, order: string}} [sort] - Optional sorting object with field and order (ascending or descending).
   * @param {boolean} [onlyComplete] - Optional flag to return only complete product records.
   * @returns {Promise<object[]>} A Promise that resolves to an array of products as objects.
   */
    async getProducts(searchWord: string, fields?: string, paginate?: {currentPage: number, step: number}, sort?: {byField: string, order: string}, onlyComplete?: boolean): Promise<object[]> {
      var params: QueryParameter[] = [
        { key: 'search_terms', value: searchWord },
        { key: 'action', value: 'process' },
        { key: 'fields', value: fields },
        { key: 'json', value: true },
      ] 

      if(onlyComplete) params.push(...completness);

      var productQuery = paginate ? new QueryObject('cgi/search.pl', params, defaultQueryOptions.baseURL).paginate(paginate.currentPage, paginate.step) 
                                  : new QueryObject('cgi/search.pl', params, defaultQueryOptions.baseURL);

      var response = await productQuery.query();
      return JSON.parse(response).products;
    }

    /**
   * Asynchronously retrieves a product based on its barcode with optional filters.
   * This function can be customized with various parameters to filter the results or
   * retrieve only complete product records.
   *
   * @param {string} barcode - The barcode of the product to retrieve.
   * @param {string} [fields] - Optional fields to retrieve for the product.
   * @param {boolean} [onlyComplete=false] - Optional flag to retrieve only complete product records.
   * @returns {Promise<object>} A Promise that resolves to the retrieved product as an object.
   */
    async getProduct(barcode: string, fields?: string, onlyComplete?: boolean): Promise<object> {
      var params: QueryParameter[] = [
        { key: 'action', value: 'process' },
        { key: 'fields', value: fields },
        { key: 'json', value: true },
      ] 
      if(onlyComplete) params.push(...completness);
      var productQuery = new QueryObject('api/v2/product/'+barcode, params, defaultQueryOptions.baseURL);

      var response = await productQuery.query();
      return JSON.parse(response).product;
    }
    
}