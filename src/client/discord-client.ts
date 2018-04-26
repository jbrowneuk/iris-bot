import { EventEmitter } from 'events';
import * as discord from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';

const DISCORD_EVENTS = {
  connected: 'ready',
  message: 'message'
};

export class DiscordClient extends EventEmitter implements Client {

  private client: discord.Client;
  private lastMessage: discord.Message;
  private connected: boolean;

  constructor(private token: string) {
    super();

    this.connected = false;

    this.lastMessage = null;

    this.client = this.generateClient();
    this.client.on(DISCORD_EVENTS.connected, () => this.onConnected());
    this.client.on(DISCORD_EVENTS.message, (message: discord.Message) => this.onMessage(message));
  }

  public connect(): void {
    this.client.login(this.token);
  }

  public disconnect(): void {
    this.client.destroy();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public findChannelById(channelId: string): discord.Channel {
    const channel = this.client.channels.find(c => c.id === channelId);
    return channel || null;
  }

  public findChannelByName(channelName: string): discord.Channel {
    const textChannels = this.client.channels.filter(c => c instanceof discord.TextChannel);
    if (textChannels.size === 0) {
      return null;
    }

    const channel = textChannels.find(c => (c as discord.TextChannel).name === channelName);
    return channel || null;
  }

  public getClientInformation(): discord.User {
    return this.client.user;
  }

  public queueMessages(messages: string[], channel?: discord.Channel): void {
    console.log(`Sending ${messages.length} messages`);
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
    if (message.channel.type !== 'text' || message.author === this.client.user) {
      return;
    }

    this.lastMessage = message;
    this.emit(LifecycleEvents.MESSAGE, message);
  }

  private sendMessage(message: string): void {
    this.lastMessage.channel.send(message);
  }
}