import { Message } from 'discord.js';
import { IMock, It, Mock } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { CallResponse } from './call-response';

describe('basic intelligence', () => {
  let personality: CallResponse;
  let mockDatabase: IMock<Database>;

  beforeEach(() => {
    mockDatabase = Mock.ofType<Database>();
    const mockDependencies: DependencyContainer = {
      client: null,
      database: mockDatabase.object,
      engine: null,
      logger: null,
      responses: null,
      settings: null
    };

    personality = new CallResponse(mockDependencies);
  });

  describe('addressed message handling', () => {
    const mockCallPrefix = '{£me} ';
    const mockCallText = 'echo';
    const mockCallFullText = mockCallPrefix + mockCallText;
    const mockResponse = 'ohce';

    beforeEach(() => {
      // Set up db mock to return value
      mockDatabase
        .setup((d) => d.getRecordsFromCollection(It.isAnyString(), It.isAny()))
        .returns((db, filter) => {
          if (!filter || filter.where.length === 0) {
            return Promise.resolve(null);
          }

          const filterWhere = filter.where[0];
          const response = filterWhere.value === mockCallFullText ? mockResponse : null;
          return Promise.resolve([{ response }]);
        });
    });

    it('should handle message with matching response', (done) => {
      personality.onAddressed(null, mockCallText).then((result: string) => {
        expect(result).toBe(mockResponse);
        done();
      });
    });

    it('should not handle message if no matching response', (done) => {
      personality.onAddressed(null, 'anything').then((result: string) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('ambient message handling', () => {
    const mockCall = 'echo';
    const mockResponse = 'ohce';

    beforeEach(() => {
      // Set up db mock to return value
      mockDatabase
        .setup((d) => d.getRecordsFromCollection(It.isAnyString(), It.isAny()))
        .returns((db, filter) => {
          if (!filter || filter.where.length === 0) {
            return Promise.resolve(null);
          }

          const filterWhere = filter.where[0];
          const response = filterWhere.value === mockCall ? mockResponse : null;
          return Promise.resolve([{ response }]);
        });
    });

    it('should handle message with matching response', (done) => {
      const message = Mock.ofType<Message>();
      message.setup((m) => m.content).returns(() => mockCall);

      personality.onMessage(message.object).then((result: string) => {
        expect(result).toBe(mockResponse);
        done();
      });
    });

    it('should not handle message if no matching response', (done) => {
      const message = Mock.ofType<Message>();
      message.setup((m) => m.content).returns(() => 'anything');

      personality.onMessage(message.object).then((result: string) => {
        expect(result).toBeNull();
        done();
      });
    });
  });
});
