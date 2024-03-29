import { Message, MessageEmbed, User } from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { COMMAND_PREFIX } from '../constants/personality-constants';
import { Client } from '../interfaces/client';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { Personality } from '../interfaces/personality';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { MessageType } from '../types';
import { getValueStartedWith, isPunctuation } from '../utils';
import { HandledResponseError } from './handled-response-error';

export const helpCommands = ['help', COMMAND_PREFIX + 'help'];
export const helpResponseText = `Hi, I’m {£me}. To get help with something, simply @ me with \`${helpCommands[0]}\` and then a topic from the list below.`;

export class BotEngine implements Engine {
  protected personalityConstructs: Personality[];

  constructor(private client: Client, private responses: ResponseGenerator, private settings: Settings, private logger: Logger) {
    this.personalityConstructs = [];
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

  public destroy(): void {
    this.personalityConstructs.forEach(personality => {
      if (typeof personality.destroy === 'function') {
        personality.destroy();
      }
    });

    this.client.disconnect();
  }

  public run(): void {
    this.attachEvents();
    this.client.connect(this.settings.getSettings().token);
  }

  private attachEvents(): void {
    this.client.on(LifecycleEvents.CONNECTED, () => this.onConnected());
    this.client.on(LifecycleEvents.MESSAGE, (message: Message) => this.onMessage(message));
  }

  private onConnected(): void {
    this.logger.log('Connected to Discord services');
  }

  protected onMessage(message: Message): void {
    const addressedMessage = this.calculateAddressedMessage(message);
    if (addressedMessage !== null) {
      this.handleAddressedMessage(message, addressedMessage);
      return;
    }

    this.handleAmbientMessage(message);
  }

  protected dequeueMessagePromises(source: Message, funcs: Array<Promise<MessageType>>): Promise<MessageType> {
    funcs.push(Promise.resolve(null)); // Lazy workaround
    return funcs.reduce((prev: Promise<MessageType>, curr: Promise<MessageType>) => {
      if (!prev) {
        return null;
      }

      return prev.then((result: MessageType) => {
        if (result !== null) {
          this.client.queueMessages(source, [result]);
          return Promise.reject(new HandledResponseError());
        }

        return curr;
      });
    }, Promise.resolve(null));
  }

  private onDequeueCatch(err: Error): void {
    if (err instanceof HandledResponseError) {
      return;
    }

    this.logger.error(err);
  }

  protected handleAmbientMessage(message: Message): void {
    const funcs = this.personalityConstructs.map((c: Personality) => c.onMessage(message));
    this.dequeueMessagePromises(message, funcs).catch(this.onDequeueCatch.bind(this));
  }

  protected handleAddressedMessage(message: Message, addressedMessage: string): void {
    // Check if requesting help
    const selectedHelp = getValueStartedWith(addressedMessage, helpCommands);
    if (selectedHelp) {
      this.handleHelpCommand(message, addressedMessage, selectedHelp);
      return;
    }

    // Check if bot was simply mentioned
    if (addressedMessage.length === 0) {
      this.responses.generateResponse('addressedNoCommand').then((response: string) => {
        this.client.queueMessages(message, [response]);
      });
      return;
    }

    const unhandledResponse = () =>
      this.responses.generateResponse('addressedNoResponse').then((response: string) => {
        this.client.queueMessages(message, [response]);
      });

    const funcs = this.personalityConstructs.map((c: Personality) => c.onAddressed(message, addressedMessage));
    this.dequeueMessagePromises(message, funcs)
      .then(response => {
        if (response !== null) {
          return;
        }

        return unhandledResponse();
      })
      .catch(this.onDequeueCatch.bind(this));
  }

  protected calculateAddressedMessage(message: Message): string {
    const botInfo = this.client.getUserInformation();
    const username = this.calculateUserName(botInfo, message);

    const atUsername = `@${username}`;
    const botId = new RegExp(`<@!?${botInfo.id}>`);
    const messageText = message.content.replace(botId, username).replace(atUsername, username);

    const lowercaseMessage = messageText.toLowerCase();
    const lowercaseUsername = username.toLowerCase();
    const usernameLocation = lowercaseMessage.indexOf(lowercaseUsername);

    if (usernameLocation < 0) {
      return null;
    }

    if (usernameLocation > 0) {
      const attentionGrabbers = ['hey', 'okay', 'ok'];
      const attentionGrabber = getValueStartedWith(lowercaseMessage, attentionGrabbers);
      if (!attentionGrabber) {
        return null;
      }

      const characterAfterAttentionGrabber = messageText.charAt(attentionGrabber.length);
      const hasAttentionGrabber = characterAfterAttentionGrabber === ' ' && usernameLocation === attentionGrabber.length + 1;

      if (!hasAttentionGrabber) {
        return null;
      }
    }

    let messageLocation = usernameLocation + username.length;
    if (messageLocation >= messageText.length) {
      return '';
    }

    const messageStartsWithPunctuation = isPunctuation(messageText.charAt(messageLocation));
    if (messageStartsWithPunctuation) {
      messageLocation += 1;
    }

    return messageText.substring(messageLocation).trim();
  }

  private calculateUserName(botInfo: User, message: Message): string {
    // If the bot is in a "server" but has been renamed, update the value of the username
    const guildMemberInfo = message.guild.members.resolve(botInfo.id);
    if (guildMemberInfo && guildMemberInfo.nickname && guildMemberInfo.nickname.length > 0) {
      return guildMemberInfo.nickname;
    }

    return botInfo.username;
  }

  /**
   * Wrapper to handle a help request
   *
   * @param message message object from server
   * @param text relevant text content from the user's message
   * @param helpCommand the detected help command from the text content
   */
  private handleHelpCommand(message: Message, text: string, helpCommand: string): void {
    message.react('🆗');
    const trimText = text.trim();

    // General bot help provided if no personality specified
    if (trimText === helpCommand) {
      return this.handleBotHelp(message);
    }

    const bits = text.split(' ');
    const commandPosition = bits.indexOf(helpCommand) + 1;
    const personalities = bits.slice(commandPosition);
    this.handlePersonalityHelp(message, personalities[0]);
  }

  /**
   * Provides general help for the bot, i.e. listing personality plugins
   */
  private handleBotHelp(source: Message): void {
    const coresWithHelp = this.personalityConstructs.filter(core => {
      return typeof core.onHelp === 'function';
    });

    const coreNames = coresWithHelp.map(core => `${core.constructor.name}`);

    const messageEmbed = new MessageEmbed();
    const topics = coreNames.length ? '`' + coreNames.join('`\n`') + '`' : 'No topics';
    messageEmbed.addFields([{ name: 'Help topics', value: topics }]);

    this.client.queueMessages(source, [helpResponseText, messageEmbed]);
  }

  /**
   * Gets the help content from a specific personality plugin
   *
   * @param message the message object from the server
   * @param personality the requested personality plugin name (i.e. contructor)
   */
  private handlePersonalityHelp(message: Message, personality: string): void {
    const helpingCore = this.personalityConstructs.find(core => core.constructor.name.toUpperCase() === personality.toUpperCase());

    if (!helpingCore) {
      return this.client.queueMessages(message, ['No help for that!']);
    }

    helpingCore.onHelp(message).then(response => {
      this.client.queueMessages(message, [response]);
    });
  }
}
