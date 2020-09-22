import { Message } from 'discord.js';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { getValueStartedWith } from '../utils';

export class SimpleInteractions implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  public onAddressed(message: Message, addressedMessage: string): Promise<string> {
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
    return Promise.resolve(null);
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

    message.react('✋').catch(e => this.dependencies.logger.error(e));
    return this.dependencies.responses.generateResponse('highFive');
  }
}
