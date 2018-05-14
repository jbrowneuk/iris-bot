import { Mock } from 'typemoq';
import { GameElements } from './game-elements';
import { Message } from 'discord.js';

describe('Game elements', () => {
  it('should not handle an addressed message', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements();

    core.onAddressed(message.object, 'anything').then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should flip a coin when +flip command is issued', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => '+flip');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      const possibleResults = ['heads', 'tails'];
      expect(possibleResults).toContain(result);
      done();
    });
  });

  it('should get heads when +flip command is issued and result greater than 0.5',
    (done: DoneFn) => {
      spyOn(Math, 'random').and.returnValue(0.6);

      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+flip');
      const core = new GameElements();

      core.onMessage(message.object).then((result: string) => {
        expect(result).toBe('heads');
        done();
      });
    });

  it('should get tails when +flip command is issued and result less than 0.5',
    (done: DoneFn) => {
      spyOn(Math, 'random').and.returnValue(0.4);

      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+flip');
      const core = new GameElements();

      core.onMessage(message.object).then((result: string) => {
        expect(result).toBe('tails');
        done();
      });
    });

  it('should fnot handle a non-command', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should roll dice in the format <count>d<sides>', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => '+roll 4d6');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      expect(result.startsWith('Rolling a 6-sided die 4 times:')).toBe(true);
      done();
    });
  });

  it('should roll a single die in the format d<sides>', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => '+roll d6');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      expect(result.startsWith('Rolling a 6-sided die 1 times:')).toBe(true);
      done();
    });
  });

  it(
    'should roll default number of dice when <count> is greater than a threshold',
    (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll 999d6');
      const core = new GameElements();

      core.onMessage(message.object).then((result: string) => {
        expect(result.startsWith('Rolling a 6-sided die 1 times:')).toBe(true);
        done();
      });
    });

  it(
    'should roll die with default number of sides when <sides> is greater than a threshold',
    (done: DoneFn) => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+roll 1d999');
      const core = new GameElements();

      core.onMessage(message.object).then((result: string) => {
        expect(result.startsWith('Rolling a 6-sided die 1 times:')).toBe(true);
        done();
      });
    });

  it('should not roll non-die strings', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => '+roll blobbly');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should not roll non-die strings containing the letter d', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => '+roll badstr');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBe('Ignoring badstr');
      done();
    });
  });
});
