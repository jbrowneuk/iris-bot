import { Message } from 'discord.js';
import { IMock, It, Mock } from 'typemoq';

import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { CallResponse } from './call-response';

describe('basic intelligence', () => {
  let personality: CallResponse;
  let mockDatabase: IMock<Database>;
  let mockMessage: IMock<Message>;

  beforeEach(() => {
    mockMessage = Mock.ofType();
    mockDatabase = Mock.ofType<Database>();
    const mockDependencies: DependencyContainer = {
      client: Mock.ofType<Client>().object,
      database: mockDatabase.object,
      engine: Mock.ofType<Engine>().object,
      logger: Mock.ofType<Logger>().object,
      responses: Mock.ofType<ResponseGenerator>().object,
      settings: Mock.ofType<Settings>().object
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
        .setup(d => d.getRecordsFromCollection(It.isAnyString(), It.isAny()))
        .returns((db, filter) => {
          if (!filter || filter.where.length === 0) {
            return Promise.resolve([]);
          }

          const filterWhere = filter.where[0];
          const response = filterWhere.value === mockCallFullText ? mockResponse : null;
          return Promise.resolve([{ response }]);
        });
    });

    it('should handle message with matching response', done => {
      personality.onAddressed(mockMessage.object, mockCallText).then((result: string) => {
        expect(result).toBe(mockResponse);
        done();
      });
    });

    it('should not handle message if no matching response', done => {
      personality.onAddressed(mockMessage.object, 'anything').then((result: string) => {
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
        .setup(d => d.getRecordsFromCollection(It.isAnyString(), It.isAny()))
        .returns((db, filter) => {
          if (!filter || filter.where.length === 0) {
            return Promise.resolve([]);
          }

          const filterWhere = filter.where[0];
          const response = filterWhere.value === mockCall ? mockResponse : null;
          return Promise.resolve([{ response }]);
        });
    });

    it('should handle message with matching response', done => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => mockCall);

      personality.onMessage(message.object).then((result: string) => {
        expect(result).toBe(mockResponse);
        done();
      });
    });

    it('should not handle message if no matching response', done => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => 'anything');

      personality.onMessage(message.object).then((result: string) => {
        expect(result).toBeNull();
        done();
      });
    });
  });
});
