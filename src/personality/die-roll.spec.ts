import { Message, MessageEmbed } from 'discord.js';
import { IMock, It, Mock } from 'typemoq';

import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { DieRoll, helpText } from './die-roll';

describe('Die Roll', () => {
  let mockResponses: IMock<ResponseGenerator>;
  let mockDependencies: DependencyContainer;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(1);

    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses.setup(r => r.generateResponse(It.isAny())).returns(input => Promise.resolve(input));

    mockDependencies = {
      client: Mock.ofType<Client>().object,
      database: Mock.ofType<Database>().object,
      engine: Mock.ofType<Engine>().object,
      logger: Mock.ofType<Logger>().object,
      responses: mockResponses.object,
      settings: Mock.ofType<Settings>().object
    };
  });

  it('should not handle an addressed non-command', done => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new DieRoll(mockDependencies);

    core.onAddressed(message.object, 'anything').then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should not handle a non-command', done => {
    const core = new DieRoll(mockDependencies);

    core.onMessage().then((result: string) => {
      expect(result).toBeNull();
      done();
    });
  });

  function runTest(addressedMessage: string): Promise<string> {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => `bot ${addressedMessage}`);

    const core = new DieRoll(mockDependencies);
    return core.onAddressed(message.object, addressedMessage);
  }

  it('should respond with error if command given with no dice', done => {
    const addressedMessage = 'roll ';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toBe('dieRollFail');
      done();
    });
  });

  it('should roll dice in the format <count>d<sides>', done => {
    const addressedMessage = 'roll 4d6';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('Rolling a *6-sided* die *4* times: 6, 6, 6, 6');
      done();
    });
  });

  it('should roll dice in the format <count>d<sides> multiple times', done => {
    const addressedMessage = 'roll 4d6 5d8';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('Rolling a *6-sided* die *4* times: 6, 6, 6, 6');
      expect(result).toContain('Rolling a *8-sided* die *5* times: 8, 8, 8, 8');
      done();
    });
  });

  it('should roll a single die in the format d<sides>', done => {
    const addressedMessage = 'roll d6';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('Rolling a *6-sided* die *1* time: 6');
      done();
    });
  });

  it('should roll default number of dice when <count> is greater than a threshold', done => {
    const addressedMessage = 'roll 999d6';

    // Set up response generator to use provided test string
    mockResponses.reset();
    mockResponses.setup(r => r.generateResponse(It.isAny())).returns(() => Promise.resolve('bad = {£rolls}'));

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('bad = 999');
      expect(result).toContain('Rolling a *6-sided* die *1* time: 6');
      done();
    });
  });

  it('should roll die with default number of sides when <sides> is greater than a threshold', done => {
    const addressedMessage = 'roll 1d999';

    // Set up response generator to use provided test string
    mockResponses.reset();
    mockResponses.setup(r => r.generateResponse(It.isAny())).returns(() => Promise.resolve('bad = {£die}'));

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('bad = d999');
      expect(result).toContain('Rolling a *6-sided* die *1* time: 6');
      done();
    });
  });

  it('should respond with error if given non-die strings', done => {
    const addressedMessage = 'roll blobbly';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toBe('dieRollFail');
      done();
    });
  });

  it('should respond with error if non-die strings containing the letter d are given', done => {
    const badString = 'badstr';
    const addressedMessage = 'roll ' + badString;
    const responseMessage = 'bad: {£bit}';

    // Set up response generator to use provided test string
    mockResponses.reset();
    mockResponses.setup(r => r.generateResponse(It.isAny())).returns(() => Promise.resolve(responseMessage));

    runTest(addressedMessage).then((result: string) => {
      expect(result).toBe('bad: ' + badString);
      done();
    });
  });

  it('should correct number of dice if not numeric', done => {
    const addressedMessage = 'roll fogd20';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('dieRollCorrectionCount');
      done();
    });
  });

  it('should stop rolling dice when threshold of 25 reached', done => {
    const addressedMessage = 'roll 5d20 5d20 5d20 5d20 5d20 5d20';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('Rolling a *20-sided* die *5* times: 20');
      expect(result).toContain('dieRollLimit');
      done();
    });
  });

  it('should calculate roll summary', done => {
    const addressedMessage = 'roll 5d20';

    runTest(addressedMessage).then((result: string) => {
      expect(result).toContain('Rolling a *20-sided* die *5* times: 20, 20, 20, 20, 20');
      expect(result).toContain('(total: 100, average: 20)');
      done();
    });
  });

  describe('Help text', () => {
    it('should respond with help text', done => {
      const core = new DieRoll(mockDependencies);
      core.onHelp().then(response => {
        const embed = response as MessageEmbed;
        expect(embed.description).toEqual(helpText);
        done();
      });
    });
  });
});
