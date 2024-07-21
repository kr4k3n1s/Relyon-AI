import axios from "axios";
// import { ObjectId } from "mongodb";

/**
 * @interface for objects that can be represented as JSON with completeness and partiality checks.
 * This interface includes methods for checking if an object is complete and partial,
 * which can be useful for filtering and validating data before converting it to JSON.
 * 
 * @property {function} isComplete - Checks if the object is complete, returns a boolean.
 * @property {function} isPartial - Checks if the object is partial, returns a boolean.
 */
export interface JSONConvertible {
    isComplete(): boolean;
    isPartial(): boolean;
}

/**
 * @interface for objects that can be stored and managed in a database.
 * This interface includes properties and methods required for basic database operations,
 * such as inserting, updating, and managing object IDs.
 *
 * @property {ObjectId} [_id] - Optional unique identifier for the object in the database.
 * @property {function} insertToDatabase - Inserts the object into the database and returns a Promise that resolves to an ObjectId.
 * @property {function} [updateOnDatabase] - Optional method to update the object in the database, returns a Promise that resolves to a boolean indicating if the update was successful.
 */
// export interface DBObject {
//     _id?: ObjectId;
//     insertToDatabase(includeIfFound?: boolean): Promise<ObjectId>;
//     updateOnDatabase?(): Promise<boolean>;
// }

/**
 * Type representing a query parameter.
 * @typedef {Object} QueryParameter
 * @property {string} key - The key (name) of the query parameter.
 * @property {any} value - The value of the query parameter.
 */
export type QueryParameter = {
    key: string, value: any
};
  
/**
 * @interface Interface representing a QueryObject based on which API calls can be easily executed.
 * @property {QueryParameter[]} params - Array of query parameters to be used in the query.
 * @property {string} baseURL - The base URL for the query.
 * @property {string} func - The function to apply in the query.
 * @property {{page: Number, step: Number}} [pagination] - Optional pagination object with the current page and step.
 */
export interface QueryObject {
    params: QueryParameter[];
    baseURL: string;
    func: string;
    pagination?: {page: Number, step: Number}
}
  
export class QueryObject {
  
    constructor (func = 'cgi/search.pl', params: QueryParameter[], baseURL: string) {
      this.params = params;
      this.params.push({key: 'json', value: 'true'});
      this.baseURL = baseURL;
      this.func = func;
    }
  
    /**
     * Sets the pagination parameters for a query and returns the modified query object.
     * This method allows for paginating query results by specifying the current page number and step size (number of items per page).
     *
     * @param {number} currentPage - The current page number.
     * @param {number} step - The step size, or number of items per page.
     * @returns {QueryObject} - The modified query object with pagination parameters applied.
     */
    paginate(currentPage: number, step: number): QueryObject{
      this.pagination = {page: Number(currentPage)+1, step: step};
      return this;
    }

    /**
     * Executes a query using axios and returns the JSON stringified result data.
     * This function builds a query using the '_buildQuery()' method, then sends an axios GET request with specified request headers.
     * It converts the result data to a JSON string before returning.
     *
     * @async
     * @returns {Promise<any>} - A Promise that resolves to the JSON stringified result data.
     */
    async query(): Promise<any> {
      const options = {
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': '*',
          'User-Agent': 'PostmanRuntime/7.29.2'
        }
      };
      // console.log('QUERY: ' + this._buildQuery());
      var result = await axios.get(this._buildQuery(), options);
      return JSON.stringify(result.data) as any;
    }
  
    /**
     * Builds the query string for a request by combining the base URL, the function, and the provided query parameters.
     * This private method iterates through the provided query parameters and appends them to the string.
     * If pagination parameters are included, they will be added to the query string as well.
     *
     * @private
     * @returns {string} - The built query string.
     */
    private _buildQuery(): string {
      var query = `${this.baseURL}/${this.func}?`;

      this.params.forEach((param) => query += `${param.key}=${param.value}&`);

      if(this.pagination) query += `page_size=${this.pagination.step}&page=${this.pagination.page}`
      if(query[query.length-1] === '&') query = query.slice(0, -1);
      
      return query;
    }
}