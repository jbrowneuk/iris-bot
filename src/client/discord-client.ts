import { EventEmitter } from 'events';
import { injectable, decorate } from 'inversify';
import * as discord from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';

import { DISCORD_EVENTS } from './discord-events';

decorate(injectable(), EventEmitter);

@injectable()
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
    this.client.on(DISCORD_EVENTS.connected, () => this.onConnected());
    this.client.on(DISCORD_EVENTS.message, (message: discord.Message) =>
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
    if (!this.client.channels.has(channelId)) {
      return null;
    }

    return this.client.channels.get(channelId);
  }

  public findChannelByName(channelName: string): discord.Channel {
    const filterProperty = 'name';
    const namedChannels = this.client.channels.filter(c =>
      Object.hasOwnProperty.call(c, filterProperty)
    );
    if (namedChannels.size === 0) {
      return null;
    }

    const channel = namedChannels.find(
      c => (c as discord.TextChannel).name === channelName
    );
    return channel || null;
  }

  public getUserInformation(): discord.User {
    return this.client.user;
  }

  public queueMessages(messages: string[], channel?: discord.Channel): void {
    messages.forEach((message: string) => this.sendMessage(message));
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

  private sendMessage(message: string): void {
    if (!message || message.length === 0) {
      return;
    }

    this.lastMessage.channel.send(message);
  }
}
