import { Channel, Message, PresenceData, User } from 'discord.js';
import { EventEmitter } from 'events';

import { MessageType } from '../types';

export interface Client extends EventEmitter {
  connect(token: string): void;
  disconnect(): void;
  isConnected(): boolean;

  findChannelById(channelId: string): Channel;

  getUserInformation(): User;

  queueMessages(messages: MessageType[]): void;

  setPresence(data: PresenceData): void;
}
