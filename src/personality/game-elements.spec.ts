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
      logger: console,
      responses: mockResponses.object,
      settings: null
    };
  });

  it('should not handle an addressed non-command', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements(mockDependencies);

    core.onAddressed(message.object, 'anything').then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should not handle a non-command', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements(mockDependencies);

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBeNull();
      done();
    });
  });

  describe('coin flip', () => {
    let message: IMock<Message>;
    let core: GameElements;

    const heads = 'flipCoinHeads';
    const tails = 'flipCoinTails';

    beforeEach(() => {
      message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+flip');

      core = new GameElements(mockDependencies);
    });

    it('should flip a coin when +flip command is issued', (done: DoneFn) => {
      const possibleResults = [heads, tails];

      core.onMessage(message.object).then((result: string) => {
        expect(possibleResults).toContain(result);
        done();
      });
    });

    it('should get heads when +flip command is issued and result greater than 0.5', (done: DoneFn) => {
      spyOn(Math, 'random').and.returnValue(0.6);

      core.onMessage(message.object).then((result: string) => {
        expect(result).toBe(heads);
        done();
      });
    });

    it('should get tails when +flip command is issued and result less than 0.5', (done: DoneFn) => {
      spyOn(Math, 'random').and.returnValue(0.4);

      core.onMessage(message.object).then((result: string) => {
        expect(result).toBe(tails);
        done();
      });
    });
  });

  describe('dice rolling', () => {
    it('should roll dice in the format <count>d<sides>', (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll 4d6');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(result.startsWith('Rolling a 6-sided die 4 times:')).toBe(true);
        done();
      });
    });

    it('should roll dice in the format <count>d<sides> multiple times', (done: DoneFn) => {
      spyOn(Math, 'random').and.returnValue(1);
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll 4d6 5d8');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(
          result.includes('Rolling a 6-sided die 4 times: 6, 6, 6, 6')
        ).toBe(true);
        expect(
          result.includes('Rolling a 8-sided die 5 times: 8, 8, 8, 8')
        ).toBe(true);
        done();
      });
    });

    it('should roll a single die in the format d<sides>', (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll d6');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(result.startsWith('Rolling a 6-sided die 1 times:')).toBe(true);
        done();
      });
    });

    it('should roll default number of dice when <count> is greater than a threshold', (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll 999d6');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(result.startsWith('Rolling a 6-sided die 1 times:')).toBe(true);
        done();
      });
    });

    it('should roll die with default number of sides when <sides> is greater than a threshold', (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll 1d999');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(result.startsWith('Rolling a 6-sided die 1 times:')).toBe(true);
        done();
      });
    });

    it('should not roll non-die strings', (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll blobbly');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should not roll non-die strings containing the letter d', (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll badstr');
      const core = new GameElements(mockDependencies);

      core.onMessage(message.object).then((result: string) => {
        expect(result).toBe('Ignoring badstr');
        done();
      });
    });
  });
});
