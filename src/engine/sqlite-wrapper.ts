import { Database } from '../interfaces/database';
import * as sqlite from 'sqlite3';
import { injectable } from 'inversify';

const databaseFile = './bot.sqlite';

@injectable()
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
    let vals: any[] = [];
    if (where.length > 0) {
      where = ` WHERE ${where}${comparisonOp}`;
      vals = objKeys.map((key: string) => filter[key]);
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${collectionName}${where}`;
      const statement = this.db.prepare(sql);
      statement.all(vals, (err: Error, rows: any) => {
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
