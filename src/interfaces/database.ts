export enum QueryLogic {
  And = 'AND',
  Or = 'OR',
  Not = 'NOT' // todo: perhaps this should be a boolean on the QueryWhere…
}

export interface QueryWhere {
  /** The field name to filter on */
  field: string;

  /** The value to filter by */
  value: string;

  // TODO: filter match method: exact, like, …

  /** Optional logic to link this filter with the previous filter */
  logic?: QueryLogic;
}

export interface QueryFilter {
  /** Optional where filter */
  where?: QueryWhere[];
}

export interface Database {
  /**
   * Connects to the database
   */
  connect(): Promise<void>;

  /**
   * Disconnects from the database
   */
  disconnect(): Promise<void>;

  /**
   * Gets a filtered set of records from a collection
   *
   * @param collectionName the collection to get
   * @param filter a filter for results
   */
  getRecordsFromCollection(collectionName: string, filter: QueryFilter): Promise<any[]>;
}
