import * as discord from 'discord.js';
import { EventEmitter } from 'events';

import { MessageType } from '../types';

export interface Client extends EventEmitter {
  connect(token: string): void;
  disconnect(): void;

  isConnected(): boolean;

  findChannelById(channelId: string): discord.Channel;
  findChannelByName(channelName: string): discord.Channel;

  getUserInformation(): discord.User;

  queueMessages(messages: MessageType[]): void;
  sendReaction(emoji: string, message?: discord.Message): void;
}
