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

  connect(): void {
    this.client = this.generateClient();
    this.client.connect().then(() => {
      this.db = this.client.db(dbName);
    }); // todo handle failure with .catch
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }

    this.client.close().then(() => {
      this.client = null;
    });
  }

  public getRecordsFromCollection(collectionName: string, filter: any): any[] {
    const results: any[] = [];
    const relatedCollection = this.db.collection(collectionName);
    const cursor = relatedCollection.find(filter);
    cursor.forEach(
      (doc: any) => {
        results.push(doc);
      },
      (err: MongoError) => {
        console.error(`Could not fetch records from ${collectionName}`, err.message);
      }
    );

    cursor.close();
    return results;
  }

  private generateClient(): MongoClient {
    return new MongoClient(uri);
  }
}
