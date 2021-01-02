import * as sqlite from 'sqlite3';

import { Database, QueryFilter, QueryLogic } from '../interfaces/database';
import { Logger } from '../interfaces/logger';

const databaseFile = './bot.sqlite';

export class SqliteWrapper implements Database {
  private db: sqlite.Database;

  constructor(private logger: Logger) {
    this.db = null;
  }

  public connect(): Promise<void> {
    if (this.db !== null) {
      return Promise.reject(new Error('Connection already established'));
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite.Database(databaseFile, (err) => {
        if (err) {
          reject(err);
        }

        this.logger.log('Connected to database');
        resolve();
      });
    });
  }

  public disconnect(): Promise<void> {
    if (this.db === null) {
      this.logger.error('Database already disconnected');
      return Promise.resolve();
    }

    this.logger.log('Disconnecting from database');
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

  public getRecordsFromCollection(
    collectionName: string,
    filter: QueryFilter
  ): Promise<any[]> {
    if (this.db === null) {
      return Promise.reject(new Error('No connection established'));
    }

    let where: string;
    let vals: string[];
    if (filter.where && filter.where.length > 0) {
      const comparisonOperator = '=?';
      where =
        ' WHERE ' +
        filter.where
          .map((op, idx) => {
            let logic = '';
            if (idx > 0) {
              logic += ` ${op.logic || QueryLogic.And} `;
            }

            return `${logic}${op.field}${comparisonOperator}`;
          })
          .join('');
      vals = filter.where.map((op) => op.value);
    } else {
      where = '';
      vals = [];
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${collectionName}${where}`;
      const statement = this.db.prepare(sql);
      statement.all(vals, (err: Error, rows: any[]) => {
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
