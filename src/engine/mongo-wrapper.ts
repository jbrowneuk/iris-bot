import { MongoClient, MongoError, Db } from 'mongodb';
import { Database } from '../interfaces/database';

const uri = 'mongodb://localhost:27017';
const dbName = 'testproject';

export class MongoWrapper implements Database {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = null;
  }

  connect(): Promise<void> {
    this.client = this.generateClient();
    return this.client.connect().then(() => {
      this.db = this.client.db(dbName);
    }); // todo handle failure with .catch
  }

  disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    return this.client.close().then(() => {
      this.client = null;
    });
  }

  public getRecordsFromCollection(collectionName: string, filter: any): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      const relatedCollection = this.db.collection(collectionName);
      const cursor = relatedCollection.find(filter);
      cursor.forEach(
        (doc: any) => {
          results.push(doc);
        },
        (err: MongoError) => {
          if (err !== null) {
            console.error(`Could not fetch records from ${collectionName}`, err.message);
            reject(err);
          }

          cursor.close();
          resolve(results);
        }
      );
    });
  }

  private generateClient(): MongoClient {
    return new MongoClient(uri);
  }
}
