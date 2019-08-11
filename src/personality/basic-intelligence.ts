import * as discord from 'discord.js';
import { Personality } from '../interfaces/personality';

/**
 * A basic personality implementation that can be used as a template to
 * implement your own personality implementations from
 */
export class BasicIntelligence implements Personality {

  /**
   * Called whenever the bot is addressed using one of the attention grabber phrases
   *
   * @param message the message object related to this call
   * @param addressedMessage the substring of the message text after the attention grabber
   */
  onAddressed(message: discord.Message, addressedMessage: string): Promise<string> {
    return Promise.resolve(null);
  }

  /**
   * Called whenever a message is sent to a channel this bot is part of
   *
   * @param message the message object related to this call
   */
  onMessage(message: discord.Message): Promise<string> {
    return new Promise((resolve) => {
      if (message.content === '+echo') {
        resolve('Echo!');
      }

      resolve(null);
    });
  }
}
