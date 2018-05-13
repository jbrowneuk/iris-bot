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

  it('should fnot handle a non-command', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup(m => m.content).returns(() => 'anything');
    const core = new GameElements();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBeNull();
      done();
    });
  });
});
