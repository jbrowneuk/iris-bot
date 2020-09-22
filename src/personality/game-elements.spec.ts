import { Message } from 'discord.js';
import { IMock, It, Mock } from 'typemoq';

import { DependencyContainer } from '../interfaces/dependency-container';
import { ResponseGenerator } from '../interfaces/response-generator';
import { GameElements } from './game-elements';

describe('Game elements', () => {
  let mockDependencies: DependencyContainer;

  beforeEach(() => {
    const mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses
      .setup(r => r.generateResponse(It.isAny()))
      .returns(input => Promise.resolve(input));

    mockDependencies = {
      client: null,
      database: null,
      engine: null,
      logger: null,
      responses: mockResponses.object,
      settings: null
    };
  });

  it('should not handle an addressed non-command', done => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements(mockDependencies);

    core.onAddressed(message.object, 'anything').then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should not handle a non-command', done => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements(mockDependencies);

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBeNull();
      done();
    });
  });

  describe('dice rolling', () => {
    beforeEach(() => {
      spyOn(Math, 'random').and.returnValue(1);
    });

    function runTest(addressedMessage: string): Promise<string> {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => `bot ${addressedMessage}`);

      const core = new GameElements(mockDependencies);
      return core.onAddressed(message.object, addressedMessage);
    }

    it('should roll dice in the format <count>d<sides>', done => {
      const addressedMessage = 'roll 4d6';

      runTest(addressedMessage).then((result: string) => {
        expect(result).toBe('Rolling a 6-sided die 4 times: 6, 6, 6, 6');
        done();
      });
    });

    it('should roll dice in the format <count>d<sides> multiple times', done => {
      const addressedMessage = 'roll 4d6 5d8';

      runTest(addressedMessage).then((result: string) => {
        expect(
          result.includes('Rolling a 6-sided die 4 times: 6, 6, 6, 6')
        ).toBe(true);
        expect(
          result.includes('Rolling a 8-sided die 5 times: 8, 8, 8, 8')
        ).toBe(true);
        done();
      });
    });

    it('should roll a single die in the format d<sides>', done => {
      const addressedMessage = 'roll d6';

      runTest(addressedMessage).then((result: string) => {
        expect(result).toBe('Rolling a 6-sided die 1 times: 6');
        done();
      });
    });

    it('should roll default number of dice when <count> is greater than a threshold', done => {
      const addressedMessage = 'roll 999d6';

      runTest(addressedMessage).then((result: string) => {
        expect(result).toBe('Rolling a 6-sided die 1 times: 6');
        done();
      });
    });

    it('should roll die with default number of sides when <sides> is greater than a threshold', done => {
      const addressedMessage = 'roll 1d999';

      runTest(addressedMessage).then((result: string) => {
        expect(result).toBe('Rolling a 6-sided die 1 times: 6');
        done();
      });
    });

    it('should not roll non-die strings', done => {
      const addressedMessage = 'roll blobbly';

      runTest(addressedMessage).then((result: string) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should not roll non-die strings containing the letter d', done => {
      const addressedMessage = 'roll badstr';

      runTest(addressedMessage).then((result: string) => {
        expect(result).toBe('Ignoring badstr');
        done();
      });
    });
  });
});
