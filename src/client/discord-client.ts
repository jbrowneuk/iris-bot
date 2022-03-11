import { Client as DiscordApiClient, ClientOptions, Intents, Message, MessageEmbed, MessageOptions, PresenceData, TextBasedChannel, User } from 'discord.js';
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

  private performTextExpansion(input: string): string {
    if (this.lastMessage.author) {
      input = input.replace(/\{£user\}/g, this.lastMessage.author.username);
    }

    input = input.replace(/\{£me\}/g, this.client.user.username);

    return input;
  }

  private sendMessage(message: MessageType): void {
    if (!message) {
      return;
    }

    // Handle string-only content
    if (typeof message === 'string') {
      if (message.length === 0) {
        return;
      }

      this.lastMessage.channel.send(this.performTextExpansion(message));
      return;
    }

    let messageOptions: MessageOptions;

    // Handle embed-only content
    // Deprecated - prefer using MessageOptions moving forward
    if (message instanceof MessageEmbed) {
      messageOptions = { embeds: [message] };
    } else {
      messageOptions = message;
    }

    if (messageOptions.content) {
      messageOptions.content = this.performTextExpansion(messageOptions.content);
    }

    this.lastMessage.channel.send(messageOptions);
  }
}
