import { Database } from '../interfaces/database';
import * as sqlite from 'sqlite3';

const databaseFile = './bot.sqlite';

export class SqliteWrapper implements Database {
  private db: sqlite.Database;

  constructor() {
    this.db = null;
  }

  connect(): Promise<void> {
    if (this.db !== null) {
      return Promise.reject(new Error('Connection already established'));
    }

    this.db = new sqlite.Database(databaseFile);
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    if (this.db === null) {
      return Promise.reject(new Error('No connection established'));
    }

    return new Promise((resolve, reject) => {
      this.db.close((err: Error) => {
        if (err) {
          reject(err);
          return;
        }

        this.db = null;
        resolve();
      });
    });
  }

  getRecordsFromCollection(collectionName: string, filter: any): Promise<any[]> {
    if (this.db === null) {
      return Promise.reject(new Error('No connection established'));
    }

    const objKeys = Object.keys(filter);
    const comparisonOp = '=?';
    let where = objKeys.join(`${comparisonOp} AND `);
    if (where.length > 0) {
      where = ` WHERE ${where}${comparisonOp}`;
    }

    return new Promise((resolve, reject) => {
      const statement = this.db.prepare(`SELECT * FROM ${collectionName}${where}`);
      statement.get(filter, (err: Error, rows: any) => {
        statement.finalize();

        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      });
    });
  }
}
