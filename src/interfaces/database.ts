import { KeyedObject } from './keyed-object';

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
  getRecordsFromCollection(
    collectionName: string,
    filter: QueryFilter
  ): Promise<any[]>;

  /**
   * Inserts a record into a collection
   *
   * @param collectionName the collection to add to
   * @param values the key-value pairs
   */
  insertRecordsToCollection(
    collectionName: string,
    values: KeyedObject
  ): Promise<void>;

  /**
   * Updates a set of records in a table
   *
   * @param collectionName collection to modify
   * @param fields records to update with values
   * @param where query filter
   */
  updateRecordsInCollection(
    collectionName: string,
    fields: KeyedObject,
    where: KeyedObject
  ): Promise<void>;
}
