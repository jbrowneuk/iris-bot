import { Message, User } from 'discord.js';
import { IMock, Mock } from 'typemoq';

import { COMMAND_PREFIX } from '../constants/personality-constants';
import { HugBot } from './hug-bot';

describe('Hugbot', () => {
  const authorId = 'AUTHID';
  const userToAddress = '<@ADDRESSED>';

  let message: IMock<Message>;
  let author: IMock<User>;

  beforeEach(() => {
    author =  Mock.ofType<User>();
    author.setup(m => m.id).returns(() => authorId);

    message = Mock.ofType<Message>();
    message.setup(m => m.author).returns(() => author.object);
  });

  it('should give an item to a user', () => {
    const command = `${COMMAND_PREFIX}cmd`;
    const item = 'spoopy';
    const text = `${command} ${userToAddress}`;
    message.setup(m => m.content).returns(() => text);

    const core = new HugBot();

    const untypedCore = core as any;
    const response = untypedCore.response(message.object, text, command, item);

    expect(response).toBe(`Gives a ${item} to ${userToAddress} from <@${authorId}>`);
  });

  it('should hug on command', (done: DoneFn) => {
    message.setup(m => m.content).returns(() => `${COMMAND_PREFIX}hug ${userToAddress}`);

    const core = new HugBot();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBe(`Gives a hug to ${userToAddress} from <@${authorId}>`);
      done();
    });
  });

  it('should give hug when asked to on an addressed message', (done: DoneFn) => {
    const addressedMessage = `give a hug to ${userToAddress}`;
    message.setup(m => m.content).returns(() => `@bot ${addressedMessage}`);

    const core = new HugBot();

    core.onAddressed(message.object, addressedMessage).then((result: string) => {
      expect(result).toBe(`Gives a hug to ${userToAddress} from <@${authorId}>`);
      done();
    });
  });

  it('should give a cake with emoji on command', (done: DoneFn) => {
    message.setup(m => m.content).returns(() => `${COMMAND_PREFIX}cake ${userToAddress}`);

    const core = new HugBot();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBe(`Gives a 🎂 to ${userToAddress} from <@${authorId}>`);
      done();
    });
  });

  it('should give cake when asked to on an addressed message', (done: DoneFn) => {
    const addressedMessage = `give a cake to ${userToAddress}`;
    message.setup(m => m.content).returns(() => `@bot ${addressedMessage}`);

    const core = new HugBot();

    core.onAddressed(message.object, addressedMessage).then((result: string) => {
      expect(result).toBe(`Gives a 🎂 to ${userToAddress} from <@${authorId}>`);
      done();
    });
  });
});
