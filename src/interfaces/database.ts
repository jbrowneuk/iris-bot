export enum QueryLogic {
  And = 'AND',
  Or = 'OR',
  Not = 'NOT'
}

export interface QueryWhere {
  field: string,
  value: string,
  logic?: QueryLogic
}

export interface QueryFilter {
  where?: QueryWhere[];
}

export interface Database {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getRecordsFromCollection(collectionName: string, filter: QueryFilter): Promise<any[]>;
}
