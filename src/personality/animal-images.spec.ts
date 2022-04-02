import * as axios from 'axios';
import { Message, MessageEmbed } from 'discord.js';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock } from 'typemoq';

import { COMMAND_PREFIX } from '../constants/personality-constants';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { AnimalImages, helpText, supportedApis } from './animal-images';

describe('Animal Image API', () => {
  let mockLogger: IMock<Logger>;
  let mockResponses: IMock<ResponseGenerator>;
  let mockDependencies: DependencyContainer;
  let personality: AnimalImages;

  beforeEach(() => {
    mockLogger = Mock.ofType<Logger>();
    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses.setup(m => m.generateResponse(It.isAnyString())).returns(input => Promise.resolve(input));

    mockDependencies = {
      client: null,
      database: null,
      engine: null,
      logger: mockLogger.object,
      responses: mockResponses.object,
      settings: null
    };

    personality = new AnimalImages(mockDependencies);
  });

  describe('onAddressed', () => {
    it('should resolve to null', done => {
      personality.onAddressed().then(value => {
        expect(value).toBeNull();
        done();
      });
    });
  });

  describe('onMessage', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      fetchSpy = spyOn(axios.default, 'get');
    });

    supportedApis.forEach(apiName => {
      it(`should call ${apiName.url} api when ${COMMAND_PREFIX}${apiName.name} invoked`, done => {
        const messageText = COMMAND_PREFIX + apiName.name;
        const mockSuccessResponse = {
          data: { link: apiName.url },
          status: StatusCodes.OK
        };

        fetchSpy.and.returnValue(Promise.resolve(mockSuccessResponse));

        const message = Mock.ofType<Message>();
        message.setup(m => m.content).returns(() => messageText);

        personality.onMessage(message.object).then(responseUrl => {
          expect(responseUrl).toBe(apiName.url);
          expect(fetchSpy).toHaveBeenCalled();
          done();
        });
      });

      it(`should handle API error for ${apiName.name}`, done => {
        const messageText = COMMAND_PREFIX + apiName.name;
        fetchSpy.and.returnValue(Promise.resolve({ status: StatusCodes.NOT_FOUND }));

        const message = Mock.ofType<Message>();
        message.setup(m => m.content).returns(() => messageText);

        personality.onMessage(message.object).then(responseText => {
          expect(responseText).toBe('apiError');
          expect(fetchSpy).toHaveBeenCalled();
          done();
        });
      });

      it(`should handle parsing error for ${apiName.name}`, done => {
        const messageText = COMMAND_PREFIX + apiName.name;
        fetchSpy.and.returnValue(Promise.reject());

        const message = Mock.ofType<Message>();
        message.setup(m => m.content).returns(() => messageText);

        personality.onMessage(message.object).then(responseText => {
          expect(responseText).toBe('apiError');
          expect(fetchSpy).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('Help text', () => {
    it('should respond with help text', done => {
      personality.onHelp().then(response => {
        const embed = response as MessageEmbed;
        expect(embed.description).toEqual(helpText);

        const commandField = embed.fields[0];
        supportedApis.forEach(api => {
          expect(commandField.value).toContain(COMMAND_PREFIX + api.name);
        });

        done();
      });
    });
  });
});
