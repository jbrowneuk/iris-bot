import * as discord from 'discord.js';
import { inject, injectable } from 'inversify';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { TYPES } from '../constants/types';
import { Client } from '../interfaces/client';
import { Engine } from '../interfaces/engine';
import { Personality } from '../interfaces/personality';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { getValueStartedWith, isPunctuation } from '../utils';

@injectable()
export class BotEngine implements Engine {
  private personalityConstructs: Personality[];

  constructor(
    @inject(TYPES.Client) private client: Client,
    @inject(TYPES.ResponseGenerator) private responses: ResponseGenerator,
    @inject(TYPES.Settings) private settings: Settings
  ) {
    this.personalityConstructs = [];
  }

  public addPersonality(personality: Personality): void {
    this.personalityConstructs.push(personality);
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
    console.log('Connected');
  }

  private onMessage(message: discord.Message): void {
    const addressedMessage = this.calculateAddressedMessage(message);
    if (addressedMessage !== null) {
      this.handleAddressedMessage(message, addressedMessage);
      return;
    }

    this.handleAmbientMessage(message);
  }

  private dequeuePromises(funcs: Array<Promise<string>>): Promise<string | void> {
    funcs.push(Promise.resolve(null)); // Lazy workaround
    return funcs.reduce(
      (prev: Promise<string>, curr: Promise<string>) => {
        return prev.then((result: string) => {
          if (result !== null) {
            this.client.queueMessages([result]);
            return;
          }

          return curr;
        });
      },
      Promise.resolve(null)
    );
  }

  private handleAmbientMessage(message: discord.Message): void {
    const funcs = this.personalityConstructs.map((c: Personality) => c.onMessage(message));
    this.dequeuePromises(funcs)
      .catch((err: any) => console.error(err));
  }

  private handleAddressedMessage(message: discord.Message, addressedMessage: string): void {
    const funcs = this.personalityConstructs.map(
      (c: Personality) => c.onAddressed(message, addressedMessage)
    );
    this.dequeuePromises(funcs)
      .then(() => {
        return this.responses.generateResponse('addressedGeneric')
          .then((response: string) => {
            this.client.queueMessages([response]);
          });
      })
      .catch((err: any) => console.error(err));
  }

  private calculateAddressedMessage(message: discord.Message): string {
    const botInfo = this.client.getUserInformation();
    let username = botInfo.username;

    // If the bot is in a "server" but has been renamed, update the value of the username
    const guildMemberInfo = message.guild.members.get(botInfo.id);
    if (guildMemberInfo && guildMemberInfo.nickname && guildMemberInfo.nickname.length > 0) {
      username = guildMemberInfo.nickname;
    }

    const atUsername = `@${username}`;
    const botId = `<@!${botInfo.id}>`;
    const messageText = message.content.replace(botId, username).replace(atUsername, username);

    const lowercaseMessage = messageText.toLowerCase();
    const lowercaseUsername = username.toLowerCase();
    const usernameLocation = lowercaseMessage.indexOf(lowercaseUsername);

    if (usernameLocation < 0) {
      return null;
    }

    if (usernameLocation > 0) {
      const attentionGrabbers = ['hey', 'ok', 'okay'];
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
}
