import * as sqlite from 'sqlite3';
import { IMock, It, Mock, Times } from 'typemoq';

import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';
import { SqliteWrapper } from './sqlite-wrapper';

class TestableSqliteWrapper extends SqliteWrapper {
  public set dbInstance(value: any) {
    this.db = value;
  }

  public get dbInstance() {
    return this.db;
  }
}

describe('SQLite wrapper', () => {
  let mockSqlite: IMock<sqlite.Database>;
  let mockStatement: IMock<sqlite.Statement>;
  let mockLogger: IMock<Logger>;
  let testObject: TestableSqliteWrapper;

  beforeEach(() => {
    mockStatement = Mock.ofType<sqlite.Statement>();

    mockSqlite = Mock.ofType<sqlite.Database>();
    mockSqlite
      .setup((m) => m.prepare(It.isAnyString()))
      .returns(() => mockStatement.object);

    mockLogger = Mock.ofType<Logger>();

    testObject = new TestableSqliteWrapper(mockLogger.object);
  });

  it('should construct', () => {
    expect(testObject).toBeTruthy();
  });

  describe('Connection logic', () => {
    // Can't work out a way to mock out the Database constructor cleanly so that
    // This test works properly. Disabling for now.
    xit('should connect', (done) => {
      const mockDbConcretion = (
        file: string,
        callback: (err: Error) => void
      ) => {
        callback(null);
      };

      spyOn(sqlite, 'Database').and.returnValue(mockDbConcretion as any);

      testObject
        .connect()
        .then(() => {
          const dbHandle = testObject.dbInstance;
          expect(dbHandle).toBeTruthy();
          expect(dbHandle.fileName).toBe('./bot.sqlite');
          done();
        })
        .catch((err) => fail(err));
    });

    it('should not attempt to reconnect if there is already a connection object', (done) => {
      testObject.dbInstance = {};

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

      testObject.dbInstance = mySqlite;

      testObject
        .disconnect()
        .then(() => {
          expect(spy).toHaveBeenCalled();
          done();
        })
        .catch(() => fail('Should not get here'));
    });

    it('should not reject when trying to disconnect if not connected', (done) => {
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
        close(cb: (err: Error) => void) {
          cb(new Error(expectedError));
        }
      };

      testObject.dbInstance = mySqlite;

      testObject
        .disconnect()
        .then(() => fail('Should not get here'))
        .catch((err: Error) => {
          expect(err).toBeTruthy();
          expect(err.message).toBe(expectedError);
          done();
        });
    });
  });

  describe('Getting records', () => {
    it('should reject when trying to get records and not connected', (done) => {
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
        .callback((_: unknown, cb: (err: Error) => void) => {
          cb(new Error(expectedError));
        });

      testObject.dbInstance = mockSqlite.object;

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
        .callback(
          (_: unknown, cb: (err: Error, rows: KeyedObject[]) => void) => {
            cb(null, mockRows);
          }
        );

      testObject.dbInstance = mockSqlite.object;

      testObject
        .getRecordsFromCollection(expectedCollection, {})
        .then((records: KeyedObject[]) => {
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
        .callback(
          (_: unknown, cb: (err: Error, rows: KeyedObject[]) => void) => {
            cb(null, []);
          }
        );

      testObject.dbInstance = mockSqlite.object;

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

  describe('Insert record functionality', () => {
    beforeEach(() => {
      testObject.dbInstance = mockSqlite.object;
    });

    it('should fix field keys that do not have $-prefix keys', (done) => {
      let lastQueryObject: KeyedObject;

      const fields = {
        bad: 'key'
      };

      mockSqlite
        .setup((m) => m.run(It.isAny(), It.isAny(), It.isAny()))
        .callback(
          (_: string, params: KeyedObject, cb: (err: Error) => void) => {
            lastQueryObject = params;
            cb(null);
          }
        );

      testObject.insertRecordsToCollection('anytable', fields).then(() => {
        const keys = Object.keys(lastQueryObject);
        expect(keys.every((key) => key.startsWith('$'))).toBeTrue();
        done();
      });
    });

    it('should format the input objects into a SQL prepared statement', (done) => {
      const mockTable = 'anyTable';

      const fields = {
        $product: 'a sample',
        $quantity: 4
      };

      mockSqlite
        .setup((m) => m.run(It.isAny(), It.isAny(), It.isAny()))
        .callback((tb: string, _: unknown, cb: (err: Error) => void) => {
          expect(tb).toContain(`INSERT INTO ${mockTable}`);
          cb(null);
        });

      testObject.insertRecordsToCollection(mockTable, fields).then(() => {
        mockSqlite.verify(
          (m) => m.run(It.isAnyString(), It.isObjectWith(fields), It.isAny()),
          Times.once()
        );

        done();
      });
    });
  });

  describe('Update record functionality', () => {
    beforeEach(() => {
      testObject.dbInstance = mockSqlite.object;
    });

    it('should fix field keys that do not have $-prefix', (done) => {
      let lastQueryObject: KeyedObject;

      const fields = {
        bad: 'key'
      };

      const where = {
        $key: 'value'
      };

      mockSqlite
        .setup((m) => m.run(It.isAny(), It.isAny(), It.isAny()))
        .callback(
          (_: string, params: KeyedObject, cb: (err: Error) => void) => {
            lastQueryObject = params;
            cb(null);
          }
        );

      testObject
        .updateRecordsInCollection('anytable', fields, where)
        .then(() => {
          const keys = Object.keys(lastQueryObject);
          expect(keys.every((key) => key.startsWith('$'))).toBeTrue();
          done();
        });
    });

    it('should fix where clause keys that do not have $-prefix', (done) => {
      let lastQueryObject: KeyedObject;

      const fields = {
        $key: 'value'
      };

      const where = {
        bad: 'key'
      };

      mockSqlite
        .setup((m) => m.run(It.isAny(), It.isAny(), It.isAny()))
        .callback(
          (_: string, params: KeyedObject, cb: (err: Error) => void) => {
            lastQueryObject = params;
            cb(null);
          }
        );

      testObject
        .updateRecordsInCollection('anytable', fields, where)
        .then(() => {
          const keys = Object.keys(lastQueryObject);
          expect(keys.every((key) => key.startsWith('$'))).toBeTrue();
          done();
        });
    });

    it('should format the input objects into a SQL prepared statement', (done) => {
      const mockTable = 'anyTable';

      const fields = {
        $product: 'a sample',
        $quantity: 4
      };

      const where = {
        $id: '12345id'
      };

      mockSqlite
        .setup((m) => m.run(It.isAny(), It.isAny(), It.isAny()))
        .callback((tb: string, _: unknown, cb: (err: Error) => void) => {
          expect(tb).toContain(`UPDATE ${mockTable}`);
          cb(null);
        });

      testObject
        .updateRecordsInCollection(mockTable, fields, where)
        .then(() => {
          mockSqlite.verify(
            (m) =>
              m.run(
                It.isAnyString(),
                It.isObjectWith({ ...fields, ...where }),
                It.isAny()
              ),
            Times.once()
          );

          done();
        });
    });

    it('should reject if query raises an error', (done) => {
      const fields = {
        $key: 'value'
      };

      const where = {
        $any: 'key'
      };

      mockSqlite
        .setup((m) => m.run(It.isAny(), It.isAny(), It.isAny()))
        .callback((_: unknown, __: unknown, cb: (err: Error) => void) => {
          cb(new Error('Hello I am a mock error'));
        });

      testObject
        .updateRecordsInCollection('anytable', fields, where)
        .then(() => fail('Query errored but wrapper did not handle'))
        .catch((err) => {
          expect(err).toBeTruthy();
          done();
        });
    });
  });
});
