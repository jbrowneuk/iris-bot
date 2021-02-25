import { Message } from 'discord.js';

import { MessageType } from '../types';

export interface Personality {
  /**
   * Called to initialise the personality once the bot is running. Optional.
   */
  initialise?(): void;

  /**
   * Called to destroy the personality when the bot is stopping. Optional.
   */
  destroy?(): void;

  /**
   * Called on every addressed (i.e. `@bot message`) message
   *
   * @param message the raw message object from the server
   * @param addressedMessage the text after the address
   * @returns (Promise<MessageType>) a promise containing the text or rich embed
   */
  onAddressed(message: Message, addressedMessage: string): Promise<MessageType>;

  /**
   * Called on every ambient (i.e. non-addressed) message
   *
   * @param message the raw message object from the server
   * @returns (Promise<MessageType>) a promise containing the text or rich embed
   */
  onMessage(message: Message): Promise<MessageType>;

  /**
   * If this optional method is implemented, it will be called when a user asks
   * for help with this specific instance
   *
   * @param message the raw message object from the server
   */
  onHelp?(message: Message): Promise<MessageType>;
}
