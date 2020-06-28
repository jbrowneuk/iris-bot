import * as discord from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { Personality } from '../interfaces/personality';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { MessageType } from '../types';
import { getValueStartedWith, isPunctuation } from '../utils';
import { HandledResponseError } from './handled-response-error';

export class BotEngine implements Engine {
  private personalityConstructs: Personality[];
  private logMessages: boolean;

  constructor(
    private client: Client,
    private responses: ResponseGenerator,
    private settings: Settings,
    private logger: Logger
  ) {
    this.personalityConstructs = [];
    this.logMessages = false;
  }

  public addPersonality(personality: Personality): void {
    this.personalityConstructs.push(personality);
  }

  public initialise(): void {
    this.personalityConstructs.forEach(personality => {
      if (typeof personality.initialise === 'function') {
        personality.initialise();
      }
    });
  }

  public run(): void {
    this.attachEvents();
    this.client.connect(this.settings.getSettings().token);
  }

  private attachEvents(): void {
    this.client.on(LifecycleEvents.CONNECTED, () => this.onConnected());
    this.client.on(LifecycleEvents.MESSAGE, (message: discord.Message) =>
      this.onMessage(message)
    );
  }

  private onConnected(): void {
    this.logger.log('Connected');
  }

  private onMessage(message: discord.Message): void {
    if (this.logMessages) {
      this.logger.log(message.content);
    }

    if (message.content && message.content.includes('+debug')) {
      const botInfo = this.client.getUserInformation();
      const username = this.calculateUserName(botInfo, message);

      this.logger.log('Calculated user name:', username);
      this.logger.log('User ID', botInfo.id);

      this.logMessages = message.content.includes('on');
      return this.client.queueMessages([
        `Message debugging: ${this.logMessages}`
      ]);
    }

    const addressedMessage = this.calculateAddressedMessage(message);
    if (addressedMessage !== null) {
      this.handleAddressedMessage(message, addressedMessage);
      return;
    }

    this.handleAmbientMessage(message);
  }

  private dequeuePromises(funcs: Array<Promise<MessageType>>): Promise<MessageType> {
    funcs.push(Promise.resolve(null)); // Lazy workaround
    return funcs.reduce((prev: Promise<MessageType>, curr: Promise<MessageType>) => {
      if (!prev) {
        return null;
      }

      return prev.then((result: MessageType) => {
        if (result !== null) {
          this.client.queueMessages([result]);
          return Promise.reject(new HandledResponseError());
        }

        return curr;
      });
    }, Promise.resolve(null));
  }

  private onDequeueCatch(err: Error): void {
    if (err instanceof HandledResponseError) {
      this.logger.log('Response handled, ignoring');
      return;
    }

    this.logger.error(err);
  }

  private handleAmbientMessage(message: discord.Message): void {
    const funcs = this.personalityConstructs.map((c: Personality) =>
      c.onMessage(message)
    );
    this.dequeuePromises(funcs).catch(this.onDequeueCatch.bind(this));
  }

  private handleAddressedMessage(
    message: discord.Message,
    addressedMessage: string
  ): void {
    if (this.logMessages) {
      this.logger.log('Message:', addressedMessage);
    }

    if (addressedMessage.length === 0) {
      this.responses
        .generateResponse('addressedNoCommand')
        .then((response: string) => {
          this.client.queueMessages([response]);
        });
      return;
    }

    const unhandledResponse = () =>
      this.responses
        .generateResponse('addressedNoResponse')
        .then((response: string) => {
          this.client.queueMessages([response]);
        });

    const funcs = this.personalityConstructs.map((c: Personality) =>
      c.onAddressed(message, addressedMessage)
    );
    this.dequeuePromises(funcs)
      .then(response => {
        if (response !== null) {
          return;
        }

        return unhandledResponse();
      })
      .catch(this.onDequeueCatch.bind(this));
  }

  private calculateAddressedMessage(message: discord.Message): string {
    const botInfo = this.client.getUserInformation();
    const username = this.calculateUserName(botInfo, message);

    const atUsername = `@${username}`;
    const botId = new RegExp(`<@!?${botInfo.id}>`);
    const messageText = message.content
      .replace(botId, username)
      .replace(atUsername, username);

    const lowercaseMessage = messageText.toLowerCase();
    const lowercaseUsername = username.toLowerCase();
    const usernameLocation = lowercaseMessage.indexOf(lowercaseUsername);

    if (usernameLocation < 0) {
      return null;
    }

    if (usernameLocation > 0) {
      const attentionGrabbers = ['hey', 'okay', 'ok'];
      const attentionGrabber = getValueStartedWith(
        lowercaseMessage,
        attentionGrabbers
      );
      if (!attentionGrabber) {
        return null;
      }

      const characterAfterAttentionGrabber = messageText.charAt(
        attentionGrabber.length
      );
      const hasAttentionGrabber =
        characterAfterAttentionGrabber === ' ' &&
        usernameLocation === attentionGrabber.length + 1;

      if (!hasAttentionGrabber) {
        return null;
      }
    }

    let messageLocation = usernameLocation + username.length;
    if (messageLocation >= messageText.length) {
      return '';
    }

    const messageStartsWithPunctuation = isPunctuation(
      messageText.charAt(messageLocation)
    );
    if (messageStartsWithPunctuation) {
      messageLocation += 1;
    }

    return messageText.substr(messageLocation).trim();
  }

  private calculateUserName(
    botInfo: discord.User,
    message: discord.Message
  ): string {
    // If the bot is in a "server" but has been renamed, update the value of the username
    const guildMemberInfo = message.guild.members.get(botInfo.id);
    if (
      guildMemberInfo &&
      guildMemberInfo.nickname &&
      guildMemberInfo.nickname.length > 0
    ) {
      return guildMemberInfo.nickname;
    }

    return botInfo.username;
  }
}
