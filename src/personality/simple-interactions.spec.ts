import { Message } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import { GIT_COMMIT } from '../git-commit';
import { DependencyContainer } from '../interfaces/dependency-container';
import { ResponseGenerator } from '../interfaces/response-generator';
import { SimpleInteractions } from './simple-interactions';

describe('Simple interactions', () => {
  let mockDeps: DependencyContainer;
  let mockResponses: IMock<ResponseGenerator>;
  let personality: SimpleInteractions;

  beforeEach(() => {
    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses
      .setup((m) => m.generateResponse(It.isAnyString()))
      .returns((i) => Promise.resolve(i));

    mockDeps = {
      client: null,
      database: null,
      engine: null,
      logger: null,
      responses: mockResponses.object,
      settings: null
    };

    personality = new SimpleInteractions(mockDeps);
  });

  it('should not handle a non-addressed message without known command', (done) => {
    const message = Mock.ofType<Message>();
    message.setup((m) => m.content).returns(() => 'anything');

    personality.onMessage(message.object).then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should not handle an addressed message without known command', (done) => {
    const message = Mock.ofType<Message>();

    personality
      .onAddressed(message.object, 'anything')
      .then((result: string) => {
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
      message.setup((m) => m.content).returns(() => `bot ${addressedMessage}`);
    });

    it('should flip a coin when +flip command is issued', (done) => {
      const possibleResults = [heads, tails];

      personality
        .onAddressed(message.object, addressedMessage)
        .then((result: string) => {
          expect(possibleResults).toContain(result);
          done();
        });
    });

    it('should get heads when +flip command is issued and result greater than 0.5', (done) => {
      spyOn(Math, 'random').and.returnValue(0.6);

      personality
        .onAddressed(message.object, addressedMessage)
        .then((result: string) => {
          expect(result).toBe(heads);
          done();
        });
    });

    it('should get tails when +flip command is issued and result less than 0.5', (done) => {
      spyOn(Math, 'random').and.returnValue(0.4);

      personality
        .onAddressed(message.object, addressedMessage)
        .then((result: string) => {
          expect(result).toBe(tails);
          done();
        });
    });
  });

  describe('High five interaction', () => {
    it('should handle an addressed message with the high five commands', async (done) => {
      const knownCommands = ['highfive', 'high five', '^5'];
      const expectedResponse = 'highFive';

      for (const command of knownCommands) {
        const message = Mock.ofType<Message>();
        message
          .setup((m) => m.react(It.isAny()))
          .returns(() => Promise.resolve(null));

        const response = await personality.onAddressed(message.object, command);

        expect(response).toBe(expectedResponse);
        message.verify((m) => m.react(It.isValue('✋')), Times.once());
      }

      done();
    });

    it('should not handle an addressed message without the high five commands', (done) => {
      const message = Mock.ofType<Message>();
      personality.onAddressed(message.object, 'anything').then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Build information', () => {
    it('should output current git commit', (done) => {
      const message = Mock.ofType<Message>();
      message.setup((m) => m.content).returns(() => '+buildInfo');

      personality.onMessage(message.object).then((response) => {
        expect(response).toContain(`\`${GIT_COMMIT}\``);
        done();
      });
    });
  });
});
