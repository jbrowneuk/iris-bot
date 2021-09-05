import { Message } from 'discord.js';

import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

/**
 * A basic personality implementation that can be used as a template to
 * implement your own personality implementations from
 *
 * Don't forget to initialise and add to the bot in the index.ts file!
 */
export class BasicIntelligence implements Personality {
  /**
   * Called whenever the bot is addressed using one of the attention grabber phrases
   *
   * @param message the message object related to this call
   * @param addressedMessage the substring of the message text after the attention grabber
   */
  public onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<MessageType> {
    return Promise.resolve(null);
  }

  /**
   * Called whenever a message is sent to a channel this bot is part of
   *
   * @param message the message object related to this call
   */
  public onMessage(message: Message): Promise<MessageType> {
    return new Promise((resolve) => {
      if (message.content === '+echo') {
        resolve('Echo!');
      }

      resolve(null);
    });
  }
}
