import { EventEmitter } from 'events';

import * as discord from 'discord.js';

export interface Client extends EventEmitter {
  connect(token: string): void;
  disconnect(): void;

  isConnected(): boolean;

  findChannelById(channelId: string): discord.Channel;
  findChannelByName(channelName: string): discord.Channel;

  getClientInformation(): discord.User;

  queueMessages(messages: string[], channel?: discord.Channel): void;
  sendReaction(emoji: string, message?: discord.Message): void;
}
