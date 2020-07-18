import * as discord from 'discord.js';
import { EventEmitter } from 'events';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { Logger } from '../interfaces/logger';
import { MessageType } from '../types';
import { messageEvent, readyEvent } from './discord-events';

export class DiscordClient extends EventEmitter implements Client {
  private client: discord.Client;
  private lastMessage: discord.Message;
  private connected: boolean;

  constructor() {
    super();

    this.client = null;
    this.lastMessage = null;
    this.connected = false;
  }

  public connect(token: string): void {
    this.client = this.generateClient();
    this.client.on(readyEvent, () => this.onConnected());
    this.client.on(messageEvent, (message: discord.Message) =>
      this.onMessage(message)
    );

    this.client.login(token);
  }

  public disconnect(): void {
    this.client.destroy();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public findChannelById(channelId: string): discord.Channel {
    return this.client.channels.resolve(channelId) || null;
  }

  public getUserInformation(): discord.User {
    return this.client.user;
  }

  public queueMessages(messages: MessageType[]): void {
    messages.forEach((message: MessageType) => this.sendMessage(message));
  }

  public sendReaction(emoji: string, message?: discord.Message): void {
    console.log(emoji);
  }

  private generateClient(): discord.Client {
    return new discord.Client();
  }

  private onConnected(): void {
    this.connected = true;
    this.emit(LifecycleEvents.CONNECTED);
  }

  private onMessage(message: discord.Message): void {
    if (
      message.channel.type !== 'text' ||
      message.author === this.client.user
    ) {
      return;
    }

    this.lastMessage = message;
    this.emit(LifecycleEvents.MESSAGE, message);
  }

  private sendMessage(message: MessageType): void {
    if (!message) {
      return;
    }

    if (typeof message === 'string' && message.length === 0) {
      return;
    }

    this.lastMessage.channel.send(message);
  }
}
