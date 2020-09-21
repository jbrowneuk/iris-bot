import { Message } from 'discord.js';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { getValueStartedWith } from '../utils';

export class SimpleInteractions implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  public onAddressed(message: Message, addressedMessage: string): Promise<string> {
    const response = this.highFive(message, addressedMessage);
    if (response) {
      return response;
    }

    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<string> {
    return Promise.resolve(null);
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
