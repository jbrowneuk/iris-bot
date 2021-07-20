import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';
import { apiUrl, prefix, startCommand } from './constants/hangman-game';
import { GameState, WordData } from './interfaces/hangman-game';
import { isGameActive } from './utilities/hangman-game';

export class HangmanGame implements Personality {
  private gameStates: Map<string, GameState>;

  constructor(private dependencies: DependencyContainer) {
    this.gameStates = new Map<string, GameState>();
  }

  onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    const messageText = message.content.toUpperCase();

    if (!messageText.startsWith(prefix)) {
      return Promise.resolve(null);
    }

    // Expect a space after prefix so use length + 1
    const text = messageText.substring(prefix.length + 1);

    if (text.startsWith(startCommand)) {
      return this.handleGameStart(message.guild.id);
    }

    return Promise.resolve(null);
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve('no help');
  }

  private handleGameStart(guildId: string): Promise<MessageType> {
    if (isGameActive(this.gameStates.get(guildId))) {
      return Promise.resolve('Game already running');
    }

    return nodeFetch
      .default(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to fetch API: ${response.status}`);
        }

        return response.json();
      })
      .then((rawData) => this.handleWordResponse(guildId, rawData))
      .catch((e) => {
        this.dependencies.logger.error(e);
        return 'My internet is not working right now.';
      });
  }

  private handleWordResponse(guildId: string, data: WordData): MessageType {
    if (!data || !data.word) {
      return 'Could not load word';
    }

    const newGameState: GameState = {
      timeStarted: Date.now(),
      currentWord: data.word,
      currentDisplay: Array(data.word.length).fill('-').join(''),
      livesRemaining: 10,
      wrongLetters: []
    };

    this.gameStates.set(guildId, newGameState);

    return '```\n' + JSON.stringify(newGameState) + '\n```';
  }
}
