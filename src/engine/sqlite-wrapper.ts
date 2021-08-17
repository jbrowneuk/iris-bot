import * as sqlite from 'sqlite3';

import { Database, QueryFilter, QueryLogic } from '../interfaces/database';
import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';

const databaseFile = './bot.sqlite';

export class SqliteWrapper implements Database {
  protected db: sqlite.Database;

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

  public getRecordsFromCollection<T>(
    collectionName: string,
    filter: QueryFilter
  ): Promise<T[]> {
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
      statement.all(vals, (err: Error, rows: T[]) => {
        statement.finalize();

        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      });
    });
  }

  public insertRecordsToCollection(
    collectionName: string,
    valuesRaw: KeyedObject
  ): Promise<void> {
    const values = this.prepareObject(valuesRaw);
    const insertLogic = Object.keys(values).join();
    const sql = `INSERT INTO ${collectionName} VALUES (${insertLogic})`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, values, (err) => {
        if (err === null) {
          resolve();
        }

        reject(err);
      });
    });
  }

  public updateRecordsInCollection(
    collectionName: string,
    fieldsRaw: KeyedObject,
    whereRaw: KeyedObject
  ): Promise<void> {
    const fields = this.prepareObject(fieldsRaw);
    const where = this.prepareObject(whereRaw);

    const queryObject = this.prepareObject({ ...fields, ...where });
    const setStr = this.prepareSqlField(fields);
    const whereStr = this.prepareSqlField(where);
    const sql = `UPDATE ${collectionName} SET ${setStr} WHERE ${whereStr}`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, queryObject, (err) => {
        if (err === null) {
          return resolve();
        }

        return reject(err);
      });
    });
  }

  /**
   * Converts a raw key-value pair object into one usable by the SQLite implementation
   * that expects object keys to be prefixed with `$`
   *
   * @param rawInput the raw key-value pair object
   * @returns a sanitised key-value pair object for use by sqlite prepared statments
   */
  private prepareObject(rawInput: KeyedObject): KeyedObject {
    const preparedObject: KeyedObject = {};
    const rawKeys = Object.keys(rawInput);
    rawKeys.forEach((key) => {
      const preparedKey = key.startsWith('$') ? key : `$${key}`;
      preparedObject[preparedKey] = rawInput[key];
    });

    return preparedObject;
  }

  /**
   * Converts a field object to a string to be used in a prepared statement
   *
   * @param fields the field object, in the format `{ $key: 'value' }`
   * @returns sql prepared statement for this object
   */
  private prepareSqlField(fields: KeyedObject): string {
    const fieldKeys = Object.keys(fields);
    const statements = fieldKeys.map((key) => {
      const tableKey = key.substring(1);
      return `${tableKey} = ${key}`;
    });

    return statements.join();
  }
}
