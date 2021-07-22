import { Message } from 'discord.js';
import { Mock } from 'typemoq';

import { BasicIntelligence } from './basic-intelligence';

describe('basic intelligence', () => {
  it('should not handle an addressed message', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup((m) => m.content).returns(() => 'anything');
    const core = new BasicIntelligence();

    core.onAddressed(message.object, 'anything').then((result) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should handle an ambient message with the echo command', (done: DoneFn) => {
    const message = Mock.ofType<Message>();
    message.setup((m) => m.content).returns(() => '+echo');
    const core = new BasicIntelligence();

    core.onMessage(message.object).then((result) => {
      expect(result).toBe('Echo!');
      done();
    });
  });
});
