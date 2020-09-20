import { Message } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

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
      .setup(m => m.generateResponse(It.isAnyString()))
      .returns(i => Promise.resolve(i));

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

  it('should not handle a non-addressed message', done => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');

    personality.onMessage(message.object).then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should handle an addressed message with the high five commands', async done => {
    const knownCommands = ['highfive', 'high five', '^5'];
    const expectedResponse = 'highFive';

    for (const command of knownCommands) {
      const message = Mock.ofType<Message>();
      message
        .setup(m => m.react(It.isAny()))
        .returns(() => Promise.resolve(null));

      const response = await personality.onAddressed(message.object, command);

      expect(response).toBe(expectedResponse);
      message.verify(m => m.react(It.isValue('✋')), Times.once());
    }

    done();
  });

  it('should not handle an addressed message without the high five commands', done => {
    const message = Mock.ofType<Message>();
    personality.onAddressed(message.object, 'anything').then(response => {
      expect(response).toBeNull();
      done();
    });
  });
});
