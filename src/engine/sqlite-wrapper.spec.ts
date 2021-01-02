import * as sqlite from 'sqlite3';
import { IMock, It, Mock, Times } from 'typemoq';

import { Logger } from '../interfaces/logger';
import { SqliteWrapper } from './sqlite-wrapper';

describe('SQLite wrapper', () => {
  let mockSqlite: IMock<sqlite.Database>;
  let mockStatement: IMock<sqlite.Statement>;
  let mockLogger: IMock<Logger>;

  beforeEach(() => {
    mockStatement = Mock.ofType<sqlite.Statement>();

    mockSqlite = Mock.ofType<sqlite.Database>();
    mockSqlite
      .setup((m) => m.prepare(It.isAnyString()))
      .returns(() => mockStatement.object);

    mockLogger = Mock.ofType<Logger>();
  });

  it('should construct', () => {
    const testObject = new SqliteWrapper(mockLogger.object);
    expect(testObject).toBeTruthy();
  });

  // Can't work out a way to mock out the Database constructor cleanly so that
  // This test works properly. Disabling for now.
  xit('should connect', (done) => {
    const mockDbConcretion = (file: string, callback: (err: Error) => void) => {
      callback(null);
    };

    spyOn(sqlite, 'Database').and.returnValue(mockDbConcretion as any);

    const testObject = new SqliteWrapper(mockLogger.object);
    testObject
      .connect()
      .then(() => {
        const dbHandle = (testObject as any).db;
        expect(dbHandle).toBeTruthy();
        expect(dbHandle.fileName).toBe('./bot.sqlite');
        done();
      })
      .catch((err) => fail(err));
  });

  it('should not attempt to reconnect if there is already a connection object', (done) => {
    const testObject = new SqliteWrapper(mockLogger.object);
    (testObject as any).db = {};

    testObject
      .connect()
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  it('should disconnect if connected', (done) => {
    const mySqlite = {
      close(cb: () => void) {
        cb();
      }
    };

    const spy = spyOn(mySqlite, 'close').and.callThrough();

    const testObject = new SqliteWrapper(mockLogger.object);
    (testObject as any).db = mySqlite;

    testObject
      .disconnect()
      .then(() => {
        expect(spy).toHaveBeenCalled();
        done();
      })
      .catch(() => fail('Should not get here'));
  });

  it('should not reject when trying to disconnect if not connected', (done) => {
    const testObject = new SqliteWrapper(mockLogger.object);

    testObject
      .disconnect()
      .then(() => {
        expect().nothing();
        done();
      })
      .catch(() => {
        fail('Throwing when disconnecting when not connected');
      });
  });

  it('should bubble up error and reject if disconnect fails', (done) => {
    const expectedError = 'ERROR';
    const mySqlite = {
      close(cb: (err: any) => void) {
        cb(new Error(expectedError));
      }
    };

    const testObject = new SqliteWrapper(mockLogger.object);
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

  it('should reject when trying to get records and not connected', (done) => {
    const testObject = new SqliteWrapper(mockLogger.object);

    testObject
      .getRecordsFromCollection('any', {})
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  it('should handle error returned from getting a collection', (done) => {
    const expectedError = 'ERROR';
    mockStatement
      .setup((m) => m.all(It.isAny(), It.isAny()))
      .callback((filter: any, cb: (err: any) => void) => {
        cb(new Error(expectedError));
      });

    const testObject = new SqliteWrapper(mockLogger.object);
    (testObject as any).db = mockSqlite.object;

    testObject
      .getRecordsFromCollection('any', {})
      .then(() => fail('Should not get here'))
      .catch((err: Error) => {
        expect(err.message).toBe(expectedError);
        done();
      });
  });

  it('should get all records from a collection', (done) => {
    const expectedCollection = 'myCollection';
    const mockRows = [{ id: 0 }, { id: 1 }];
    mockStatement
      .setup((m) => m.all(It.isAny(), It.isAny()))
      .callback((filter: any, cb: (err: any, rows: any[]) => void) => {
        cb(null, mockRows);
      });

    const testObject = new SqliteWrapper(mockLogger.object);
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

  it('should correctly build SQL statement when filter has been applied', (done) => {
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

    const testObject = new SqliteWrapper(mockLogger.object);
    (testObject as any).db = mockSqlite.object;

    testObject
      .getRecordsFromCollection('col', filter)
      .then(() => {
        mockSqlite.verify(
          (m) => m.prepare(It.isValue(`SELECT * FROM col WHERE a=? AND b=?`)),
          Times.once()
        );
        done();
      })
      .catch((err) => fail(err));
  });
});
