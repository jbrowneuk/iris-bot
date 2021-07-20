import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

const apiUrl = 'https://jbrowne.io/api/words/';

export class HangmanGame implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  onAddressed(message: Message, messageText: string): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    if (message.content.startsWith('+hangman-test')) {
      return nodeFetch
        .default(apiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Unable to fetch API');
          }

          return response.json();
        })
        .then((rawData) => this.handleWordResponse(rawData))
        .catch((e) => {
          this.dependencies.logger.error(e);
          return 'My internet is not working right now.';
        });
    }
    return Promise.resolve(null);
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve('no help');
  }

  private handleWordResponse(wordData: any): MessageType {
    return wordData && wordData.word ? wordData.word : 'no words';
  }
}
