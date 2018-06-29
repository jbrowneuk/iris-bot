import { IMock, Mock } from 'typemoq';
import { HugBot } from './hug-bot';
import { Message, User } from 'discord.js';

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

  it('should not handle an addressed message', (done: DoneFn) => {
    message.setup(m => m.content).returns(() => 'anything');

    const core = new HugBot();

    core.onAddressed(message.object, 'anything').then((result: string) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should give an item to a user', () => {
    const command = 'cmd';
    const item = 'spoopy';
    message.setup(m => m.content).returns(() => `!${command} ${userToAddress}`);

    const core = new HugBot();

    const untypedCore = core as any;
    const response = untypedCore.response(message.object, command, item);

    expect(response).toBe(`Gives a ${item} to ${userToAddress} from <@${authorId}>`);
  });

  it('should hug on !hug command', (done: DoneFn) => {
    message.setup(m => m.content).returns(() => `!hug ${userToAddress}`);

    const core = new HugBot();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBe(`Gives a hug to ${userToAddress} from <@${authorId}>`);
      done();
    });
  });

  it('should give a cake with emoji on !cake command', (done: DoneFn) => {
    message.setup(m => m.content).returns(() => `!cake ${userToAddress}`);

    const core = new HugBot();

    core.onMessage(message.object).then((result: string) => {
      expect(result).toBe(`Gives a 🎂 to ${userToAddress} from <@${authorId}>`);
      done();
    });
  });
});
