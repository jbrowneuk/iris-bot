import { Message, MessageReaction } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { helpText, SimpleInteractions } from './simple-interactions';

describe('Simple interactions', () => {
  let mockDeps: DependencyContainer;
  let mockResponses: IMock<ResponseGenerator>;
  let personality: SimpleInteractions;

  beforeEach(() => {
    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses.setup(m => m.generateResponse(It.isAnyString())).returns(i => Promise.resolve(i));

    mockDeps = {
      client: Mock.ofType<Client>().object,
      database: Mock.ofType<Database>().object,
      engine: Mock.ofType<Engine>().object,
      logger: Mock.ofType<Logger>().object,
      responses: mockResponses.object,
      settings: Mock.ofType<Settings>().object
    };

    personality = new SimpleInteractions(mockDeps);
  });

  it('should not handle a non-addressed message', done => {
    personality.onMessage().then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should not handle an addressed message without known command', done => {
    const message = Mock.ofType<Message>();

    personality.onAddressed(message.object, 'anything').then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  describe('Coin flip interaction', () => {
    let message: IMock<Message>;

    const addressedMessage = 'flip a coin';
    const heads = 'flipCoinHeads';
    const tails = 'flipCoinTails';

    beforeEach(() => {
      message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => `bot ${addressedMessage}`);
    });

    it('should flip a coin when +flip command is issued', done => {
      const possibleResults = [heads, tails];

      personality.onAddressed(message.object, addressedMessage).then((result: string) => {
        expect(possibleResults).toContain(result);
        done();
      });
    });

    it('should get heads when +flip command is issued and result greater than 0.5', done => {
      jest.spyOn(Math, 'random').mockReturnValue(0.6);

      personality.onAddressed(message.object, addressedMessage).then((result: string) => {
        expect(result).toBe(heads);
        done();
      });
    });

    it('should get tails when +flip command is issued and result less than 0.5', done => {
      jest.spyOn(Math, 'random').mockReturnValue(0.4);

      personality.onAddressed(message.object, addressedMessage).then((result: string) => {
        expect(result).toBe(tails);
        done();
      });
    });
  });

  describe('High five interaction', () => {
    const knownCommands = ['highfive', 'high five', '^5'];
    const expectedResponse = 'highFive';

    knownCommands.forEach(command => {
      it(`should handle an addressed message with the known '${command}'' command`, done => {
        const message = Mock.ofType<Message>();
        message.setup(m => m.react(It.isAny())).returns(() => Promise.resolve(Mock.ofType<MessageReaction>().object));

        personality.onAddressed(message.object, command).then(response => {
          expect(response).toBe(expectedResponse);
          message.verify(m => m.react(It.isValue('✋')), Times.once());

          done();
        });
      });
    });

    it('should not handle an addressed message without the high five commands', done => {
      const message = Mock.ofType<Message>();
      personality.onAddressed(message.object, 'anything').then(response => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Help text', () => {
    it('should respond with help text', done => {
      personality.onHelp().then(response => {
        expect(response).toEqual(helpText);
        done();
      });
    });
  });
});
