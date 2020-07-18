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

  /** Called on every addressed (i.e. `@bot message`) message */
  onAddressed(message: Message, addressedMessage: string): Promise<MessageType>;

  /** Called on every ambient (i.e. non-addressed) message */
  onMessage(message: Message): Promise<MessageType>;
}
