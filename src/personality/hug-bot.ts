import * as discord from 'discord.js';
import { Personality } from '../interfaces/personality';

export class HugBot implements Personality {
  public onAddressed(
    message: discord.Message,
    addressedMessage: string
  ): Promise<string> {
    return this.commandWrapper(message, addressedMessage, 'give a ', ' to');
  }

  public onMessage(message: discord.Message): Promise<string> {
    return this.commandWrapper(message, message.content, '!', '');
  }

  private commandWrapper(
    message: discord.Message,
    text: string,
    prefix: string,
    suffix: string
  ): Promise<string> {
    return new Promise((resolve) => {
      let sentMessage = null;
      const send = (messageText: string) => {
        if (messageText === null) {
          return;
        }

        sentMessage = messageText;
      };

      send(this.response(message, text, `${prefix}hug${suffix}`, 'hug'));
      send(this.response(message, text, `${prefix}cake${suffix}`, '🎂'));
      send(this.response(message, text, `${prefix}pizza${suffix}`, '🍕'));
      send(this.response(message, text, `${prefix}burger${suffix}`, '🍔'));
      send(this.response(message, text, `${prefix}beer${suffix}`, '🍺'));
      send(this.response(message, text, `${prefix}cookie${suffix}`, '🍪'));
      send(this.response(message, text, `${prefix}something healthy${suffix}`, '🥗'));

      resolve(sentMessage);
    });
  }

  private response(
    message: discord.Message,
    text: string,
    command: string,
    itemOverride?: string
  ): string {
    if (!text.startsWith(command)) {
      return null;
    }

    const item = itemOverride ? itemOverride : command;
    const bits = text.substr(command.length + 1).split(' ');
    const addressedBitIndex = 0;
    if (bits[addressedBitIndex].startsWith('<@') && bits[addressedBitIndex].endsWith('>')) {
      return `Gives a ${item} to ${bits[addressedBitIndex]} from <@${message.author.id}>`;
    }

    return null;
  }
}
