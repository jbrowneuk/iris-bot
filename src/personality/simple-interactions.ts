import { Message } from 'discord.js';

import { GIT_COMMIT } from '../git-commit';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { getValueStartedWith } from '../utils';

export const helpText = `The Simple Interactions plugin provides responses for flipping coins and high fives.
Using \`{£me} high five\` or \`{£me} ^5\` will give you a virtual high five.
Using \`{£me} flip a coin\` will flip a virtual coin.`;

export class SimpleInteractions implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  public onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<string> {
    let response = this.highFive(message, addressedMessage);
    if (response) {
      return response;
    }

    response = this.flipCoin(addressedMessage);
    if (response !== null) {
      return response;
    }

    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<string> {
    const response = this.getBuildInfo(message.content);
    if (response !== null) {
      return response;
    }

    return Promise.resolve(null);
  }

  onHelp(): Promise<string> {
    return Promise.resolve(helpText);
  }

  /**
   * Flips a coin and returns 'heads' or 'tails' as a message
   *
   * @param message the message object related to this call
   */
  private flipCoin(messageContent: string): Promise<string> {
    const command = 'flip a coin';
    if (!messageContent.startsWith(command)) {
      return null;
    }

    const coinSide = Math.random() > 0.5 ? 'Heads' : 'Tails';
    const phrase = `flipCoin${coinSide}`;
    return this.dependencies.responses.generateResponse(phrase);
  }

  private highFive(message: Message, messageText: string): Promise<string> {
    const commands = ['highfive', 'high five', '^5'];
    const startsWithCommand = getValueStartedWith(messageText, commands);
    if (!startsWithCommand) {
      return null;
    }

    message.react('✋').catch((e) => this.dependencies.logger.error(e));
    return this.dependencies.responses.generateResponse('highFive');
  }

  private getBuildInfo(messageContent: string): Promise<string> {
    const command = '+buildInfo';
    if (!messageContent.startsWith(command)) {
      return null;
    }

    const formattedOutput = `Your bot is running the iris-bot framework.
https://github.com/jbrowneuk/iris-bot
Commit \`${GIT_COMMIT.commit}\` (from \`${GIT_COMMIT.refs}\` on ${GIT_COMMIT.date})
Node ${process.version} (${process.platform} ${process.arch})`;
    return Promise.resolve(formattedOutput);
  }
}
