import * as sqlite from 'sqlite3';
import { IMock, It, Mock, Times } from 'typemoq';

import { SqliteWrapper } from './sqlite-wrapper';

describe('SQLite wrapper', () => {
  let mockSqlite: IMock<sqlite.Database>;
  let mockStatement: IMock<sqlite.Statement>;

  beforeEach(() => {
    mockStatement = Mock.ofType<sqlite.Statement>();

    mockSqlite = Mock.ofType<sqlite.Database>();
    mockSqlite
      .setup((m) => m.prepare(It.isAnyString()))
      .returns(() => mockStatement.object);
  });

  it('should construct', () => {
    const testObject = new SqliteWrapper();
    expect(testObject).toBeTruthy();
  });

  it('should not attempt to reconnect if there is already a connection object', (done: DoneFn) => {
    const testObject = new SqliteWrapper();
    (testObject as any).db = {};

    testObject
      .connect()
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  it('should disconnect if connected', (done: DoneFn) => {
    const mySqlite = {
      close(cb: () => void) {
        cb();
      }
    };

    const spy = spyOn(mySqlite, 'close').and.callThrough();

    const testObject = new SqliteWrapper();
    (testObject as any).db = mySqlite;

    testObject
      .disconnect()
      .then(() => {
        expect(spy).toHaveBeenCalled();
        done();
      })
      .catch(() => fail('Should not get here'));
  });

  it('should reject when trying to disconnect if not connected', (done: DoneFn) => {
    const testObject = new SqliteWrapper();

    testObject
      .disconnect()
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  it('should bubble up error and reject if disconnect fails', (done: DoneFn) => {
    const expectedError = 'ERROR';
    const mySqlite = {
      close(cb: (err: any) => void) {
        cb(new Error(expectedError));
      }
    };

    const testObject = new SqliteWrapper();
    (testObject as any).db = mySqlite;

    testObject
      .disconnect()
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        expect(err.message).toBe(expectedError);
        done();
      });
  });

  it('should reject when trying to get records and not connected', (done: DoneFn) => {
    const testObject = new SqliteWrapper();

    testObject
      .getRecordsFromCollection('any', {})
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  it('should handle error returned from getting a collection', (done: DoneFn) => {
    const expectedError = 'ERROR';
    mockStatement
      .setup((m) => m.all(It.isAny(), It.isAny()))
      .callback((filter: any, cb: (err: any) => void) => {
        cb(new Error(expectedError));
      });

    const testObject = new SqliteWrapper();
    (testObject as any).db = mockSqlite.object;

    testObject
      .getRecordsFromCollection('any', {})
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err.message).toBe(expectedError);
        done();
      });
  });

  it('should get all records from a collection', (done: DoneFn) => {
    const expectedCollection = 'myCollection';
    const mockRows = [{ id: 0 }, { id: 1 }];
    mockStatement
      .setup((m) => m.all(It.isAny(), It.isAny()))
      .callback((filter: any, cb: (err: any, rows: any[]) => void) => {
        cb(null, mockRows);
      });

    const testObject = new SqliteWrapper();
    (testObject as any).db = mockSqlite.object;

    testObject
      .getRecordsFromCollection(expectedCollection, {})
      .then((records: any[]) => {
        mockSqlite.verify(
          (m) => m.prepare(It.isValue(`SELECT * FROM ${expectedCollection}`)),
          Times.once()
        );
        expect(records).toEqual(mockRows);
        done();
      })
      .catch((err) => fail(err));
  });

  it('should correctly build SQL statement when filter has been applied', (done: DoneFn) => {
    const filter = {
      where: [
        { field: 'a', value: 'a' },
        { field: 'b', value: 'b' }
      ]
    };
    mockStatement
      .setup((m) => m.all(It.isAny(), It.isAny()))
      .callback((f: any, cb: (err: any, rows: any[]) => void) => {
        cb(null, []);
      });

    const testObject = new SqliteWrapper();
    (testObject as any).db = mockSqlite.object;

    testObject
      .getRecordsFromCollection('col', filter)
      .then((records: any[]) => {
        mockSqlite.verify(
          (m) => m.prepare(It.isValue(`SELECT * FROM col WHERE a=? AND b=?`)),
          Times.once()
        );
        done();
      })
      .catch((err) => fail(err));
  });
});
