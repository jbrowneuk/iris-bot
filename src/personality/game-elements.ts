import * as discord from 'discord.js';
import { Personality } from '../interfaces/personality';

export class GameElements implements Personality {
  public onAddressed(message: discord.Message, addressedMessage: string): Promise<string> {
    return Promise.resolve(null);
  }

  public onMessage(message: discord.Message): Promise<string> {
    return new Promise((resolve, reject) => {
      const response = this.flipCoin(message);
      if (response !== null) {
        resolve(response);
        return;
      }

      resolve(null);
    });
  }

  private flipCoin(message: discord.Message): string {
    if (message.content.startsWith('+flip')) {
      return Math.random() > 0.5 ? 'heads' : 'tails';
    }

    return null;
  }
}
