import * as discord from 'discord.js';
import { Personality } from '../interfaces/personality';

export class BasicIntelligence implements Personality {
  onAddressed(message: discord.Message, addressedMessage: string): Promise<string> {
    return Promise.resolve(null);
  }

  onMessage(message: discord.Message): Promise<string> {
    return new Promise((resolve, reject) => {
      if (message.content === '+echo') {
        resolve('Echo!');
      }

      resolve(null);
    });
  }
}
