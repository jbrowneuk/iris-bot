import { Message } from 'discord.js';

import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

export class HangmanGame implements Personality {
  onAddressed(message: Message, messageText: string): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onHelp?(): Promise<MessageType> {
    return Promise.resolve('');
  }
}
