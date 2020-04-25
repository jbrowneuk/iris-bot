import * as discord from 'discord.js';
import { EventEmitter } from 'events';

export interface Client extends EventEmitter {
  connect(token: string): void;
  disconnect(): void;

  isConnected(): boolean;

  findChannelById(channelId: string): discord.Channel;
  findChannelByName(channelName: string): discord.Channel;

  getUserInformation(): discord.User;

  queueMessages(messages: Array<string | discord.RichEmbed>): void;
  sendReaction(emoji: string, message?: discord.Message): void;
}
