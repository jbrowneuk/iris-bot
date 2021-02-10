import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';
import { IMock, It, Mock } from 'typemoq';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { FoxBot, supportedApis } from './fox-bot';

describe('Animal Image API', () => {
  let mockLogger: IMock<Logger>;
  let mockResponses: IMock<ResponseGenerator>;
  let mockDependencies: DependencyContainer;
  let personality: FoxBot;

  beforeEach(() => {
    mockLogger = Mock.ofType<Logger>();
    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses
      .setup((m) => m.generateResponse(It.isAnyString()))
      .returns((input) => Promise.resolve(input));

    mockDependencies = {
      client: null,
      database: null,
      engine: null,
      logger: mockLogger.object,
      responses: mockResponses.object,
      settings: null
    };

    personality = new FoxBot(mockDependencies);
  });

  describe('onAddressed', () => {
    it('should resolve to null', (done) => {
      const message = Mock.ofType<Message>();
      message.setup((m) => m.content).returns(() => 'anything');

      personality.onAddressed(message.object, 'anything').then((value) => {
        expect(value).toBeNull();
        done();
      });
    });
  });

  describe('onMessage', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      fetchSpy = spyOn(nodeFetch, 'default');
    });

    supportedApis.forEach((apiName) => {
      it(`should call ${apiName} api when +${apiName} invoked`, (done) => {
        const messageText = `+${apiName}`;
        const mockSuccessResponse = {
          json: () => Promise.resolve({ link: apiName }),
          ok: true
        };

        fetchSpy.and.returnValue(Promise.resolve(mockSuccessResponse));

        const message = Mock.ofType<Message>();
        message.setup((m) => m.content).returns(() => messageText);

        personality.onMessage(message.object).then((responseUrl) => {
          expect(responseUrl).toBe(apiName);
          expect(fetchSpy).toHaveBeenCalled();
          done();
        });
      });

      it(`should handle API error for ${apiName}`, (done) => {
        const messageText = `+${apiName}`;
        fetchSpy.and.returnValue(Promise.resolve({ ok: false }));

        const message = Mock.ofType<Message>();
        message.setup((m) => m.content).returns(() => messageText);

        personality.onMessage(message.object).then((responseText) => {
          expect(responseText).toBe('apiError');
          expect(fetchSpy).toHaveBeenCalled();
          done();
        });
      });

      it(`should handle parsing error for ${apiName}`, (done) => {
        const messageText = `+${apiName}`;
        fetchSpy.and.returnValue(Promise.reject());

        const message = Mock.ofType<Message>();
        message.setup((m) => m.content).returns(() => messageText);

        personality.onMessage(message.object).then((responseText) => {
          expect(responseText).toBe('apiError');
          expect(fetchSpy).toHaveBeenCalled();
          done();
        });
      });
    });
  });
});
