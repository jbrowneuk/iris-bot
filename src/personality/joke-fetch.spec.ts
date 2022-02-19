import * as axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock } from 'typemoq';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
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
      client: null,
      database: null,
      engine: null,
      logger: mockLogger.object,
      responses: mockResponses.object,
      settings: null
    };

    personality = new Jokes(mockDependencies);
  });

  describe('onAddressed', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      fetchSpy = spyOn(axios.default, 'get');
    });

    it('should not handle non-commands', done => {
      const modifiedCommand = `${commandString} other text`;
      personality.onAddressed(null, modifiedCommand).then(responseText => {
        expect(responseText).toBe(null);
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

      fetchSpy.and.returnValue(Promise.resolve(mockSuccessResponse));

      personality.onAddressed(null, commandString).then(responseText => {
        expect(responseText).toBe(mockSuccessText);
        expect(fetchSpy).toHaveBeenCalledWith(apiEndpoint);
        done();
      });
    });

    it('should handle API error', done => {
      fetchSpy.and.returnValue(Promise.resolve({ status: StatusCodes.NOT_FOUND }));

      personality.onAddressed(null, commandString).then(responseText => {
        expect(responseText).toBe('apiError');
        expect(fetchSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should handle parsing error for API response', done => {
      fetchSpy.and.returnValue(Promise.reject());

      personality.onAddressed(null, commandString).then(responseText => {
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
