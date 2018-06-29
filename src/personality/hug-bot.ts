import * as discord from 'discord.js';
import { Personality } from '../interfaces/personality';

export class HugBot implements Personality {
  public onAddressed(
    message: discord.Message,
    addressedMessage: string
  ): Promise<string> {
    return Promise.resolve(null);
  }

  public onMessage(message: discord.Message): Promise<string> {
    return new Promise((resolve, reject) => {
      const send = (message: string) => {
        if (message === null) {
          return;
        }

        resolve(message);
      };

      send(this.response(message, 'hug'));
      send(this.response(message, 'cake', '🎂'));
      send(this.response(message, 'pizza', '🍕'));
      send(this.response(message, 'burger', '🍔'));
      send(this.response(message, 'beer', '🍺'));
      send(this.response(message, 'cookie', '🍪'));

      resolve(null);
    });
  }

  private response(message: discord.Message, command: string, itemOverride?: string): string {
    if (!message.content.startsWith(`!${command}`)) {
      return null;
    }

    let item;
    if (!itemOverride) {
      item = command;
    } else {
      item = itemOverride;
    }

    const bits = message.content.split(' ');
    if (bits[1].startsWith('<@') && bits[1].endsWith('>')) {
      return `Gives a ${item} to ${bits[1]} from <@${message.author.id}>`;
    }

    return null;
  }
}
