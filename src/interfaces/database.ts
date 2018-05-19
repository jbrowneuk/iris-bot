export interface Database {
  connect(): void;
  disconnect(): void;
  getRecordsFromCollection(collectionName: string, filter: any): any[];
}
