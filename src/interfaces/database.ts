export interface Database {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getRecordsFromCollection(collectionName: string, filter: any): Promise<any[]>;
}
