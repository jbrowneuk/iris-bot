import { injectable, inject } from 'inversify';

import * as discord from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { TYPES } from '../constants/types';
import { Client } from '../interfaces/client';
import { Engine } from '../interfaces/engine';
import { Personality } from '../interfaces/personality';
import { getValueStartedWith, isPunctuation } from '../utils';

const token = ''; // DO NOT SUBMIT

@injectable()
export class BotEngine implements Engine {
  private personalityConstructs: Personality[];

  constructor(@inject(TYPES.Client) private client: Client) {
    this.personalityConstructs = [];
  }

  public addPersonality(personality: Personality): void {
    this.personalityConstructs.push(personality);
  }

  public run(): void {
    this.attachEvents();
    this.client.connect(token);
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

  private dequeuePromises(funcs: Promise<string>[]): Promise<string | void> {
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
        this.client.queueMessages(['Unhandled addressed message (yeah I\'m totally a bot)']);
      })
      .catch((err: any) => console.error(err));
  }

  private calculateAddressedMessage(message: discord.Message): string {
    const botInfo = this.client.getUserInformation();
    const username = botInfo.username;
    const botId = `<@${botInfo.id}>`;
    const messageText = message.content.replace(botId, username);

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
