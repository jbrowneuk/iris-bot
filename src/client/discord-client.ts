import { Client as DiscordApiClient, ClientOptions, Intents, Message, MessageEmbed, PresenceData, TextBasedChannel, User } from 'discord.js';
import { EventEmitter } from 'events';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { Logger } from '../interfaces/logger';
import { MessageType } from '../types';
import { messageEvent, readyEvent } from './discord-events';

export class DiscordClient extends EventEmitter implements Client {
  private client: DiscordApiClient;
  private lastMessage: Message;
  private connected: boolean;

  constructor(private logger: Logger) {
    super();

    this.client = null;
    this.lastMessage = null;
    this.connected = false;
  }

  public connect(token: string): void {
    this.client = this.generateClient();
    this.client.on(readyEvent, () => this.onConnected());
    this.client.on(messageEvent, (message: Message) => this.onMessage(message));

    this.client.login(token);
  }

  public disconnect(): void {
    this.client.destroy();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public findChannelById(channelId: string): TextBasedChannel {
    const relatedChannel = this.client.channels.resolve(channelId);
    if (!relatedChannel || !relatedChannel.isText) {
      return null;
    }

    return relatedChannel as TextBasedChannel;
  }

  public getUserInformation(): User {
    return this.client.user;
  }

  public queueMessages(messages: MessageType[]): void {
    messages.forEach((message: MessageType) => this.sendMessage(message));
  }

  public setPresence(data: PresenceData): void {
    this.client.user.setPresence(data);
  }

  private generateClient(): DiscordApiClient {
    const clientOptions: ClientOptions = {
      intents: [Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES]
    };

    return new DiscordApiClient(clientOptions);
  }

  private onConnected(): void {
    this.connected = true;
    this.emit(LifecycleEvents.CONNECTED);
  }

  private onMessage(message: Message): void {
    if (!message.channel.isText || message.author === this.client.user) {
      return;
    }

    this.lastMessage = message;
    this.emit(LifecycleEvents.MESSAGE, message);
  }

  private sendMessage(message: MessageType): void {
    if (!message) {
      return;
    }

    if (message instanceof MessageEmbed) {
      this.lastMessage.channel.send({ embeds: [message] });
      return;
    }

    if (message.length === 0) {
      return;
    }

    if (this.lastMessage.author) {
      message = message.replace(/\{£user\}/g, this.lastMessage.author.username);
    }

    message = message.replace(/\{£me\}/g, this.client.user.username);

    this.lastMessage.channel.send(message);
  }
}
