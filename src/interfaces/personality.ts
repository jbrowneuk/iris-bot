import { Message } from 'discord.js';

import { MessageType } from '../types';

export interface Personality {
  onAddressed(message: Message, addressedMessage: string): Promise<MessageType>;
  onMessage(message: Message): Promise<MessageType>;
}
