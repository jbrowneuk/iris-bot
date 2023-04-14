import * as axios from 'axios';
import { Message } from 'discord.js';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock } from 'typemoq';

import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { apiEndpoint, commandString, Jokes } from './joke-fetch';

describe('Joke fetching personality', () => {
  let mockLogger: IMock<Logger>;
  let mockResponses: IMock<ResponseGenerator>;

  let personality: Jokes;

  beforeEach(() => {
    mockLogger = Mock.ofType<Logger>();
    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses.setup(m => m.generateResponse(It.isAnyString())).returns(input => Promise.resolve(input));

    const mockDependencies: DependencyContainer = {
      client: Mock.ofType<Client>().object,
      database: Mock.ofType<Database>().object,
      engine: Mock.ofType<Engine>().object,
      logger: mockLogger.object,
      responses: mockResponses.object,
      settings: Mock.ofType<Settings>().object
    };

    personality = new Jokes(mockDependencies);
  });

  describe('onAddressed', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(axios.default, 'get');
    });

    it('should not handle non-commands', done => {
      const modifiedCommand = `${commandString} other text`;
      personality.onAddressed(Mock.ofType<Message>().object, modifiedCommand).then(responseText => {
        expect(responseText).toBeNull();
        expect(fetchSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should call API when command invoked', done => {
      const mockSuccessText = 'success';
      const mockSuccessResponse = {
        data: { text: mockSuccessText },
        status: StatusCodes.OK
      };

      fetchSpy.mockReturnValue(Promise.resolve(mockSuccessResponse));

      personality.onAddressed(Mock.ofType<Message>().object, commandString).then(responseText => {
        expect(responseText).toBe(mockSuccessText);
        expect(fetchSpy).toHaveBeenCalledWith(apiEndpoint);
        done();
      });
    });

    it('should handle API error', done => {
      fetchSpy.mockReturnValue(Promise.resolve({ status: StatusCodes.NOT_FOUND }));

      personality.onAddressed(Mock.ofType<Message>().object, commandString).then(responseText => {
        expect(responseText).toBe('apiError');
        expect(fetchSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should handle parsing error for API response', done => {
      fetchSpy.mockReturnValue(Promise.reject());

      personality.onAddressed(Mock.ofType<Message>().object, commandString).then(responseText => {
        expect(responseText).toBe('apiError');
        expect(fetchSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('onMessage', () => {
    it('should resolve to null', done => {
      personality.onMessage().then(value => {
        expect(value).toBeNull();
        done();
      });
    });
  });
});
