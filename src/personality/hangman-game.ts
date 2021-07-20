import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';
import { apiUrl, blankDisplayChar, guessCommand, prefix, startCommand } from './constants/hangman-game';
import { generateGameEmbed, generateHelpEmbed } from './embeds/hangman-game';
import { GameState, WordData } from './interfaces/hangman-game';
import { isGameActive } from './utilities/hangman-game';

export class HangmanGame implements Personality {
  protected gameStates: Map<string, GameState>;

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

    if (text.startsWith(guessCommand)) {
      const guess = text.substring(guessCommand.length + 1);
      return Promise.resolve(this.handleGuess(message.guild.id, guess));
    }

    return this.handleBlankCommand(message.guild.id);
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve(generateHelpEmbed());
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
      currentWord: data.word.toUpperCase(),
      currentDisplay: Array(data.word.length).fill('-').join(''),
      livesRemaining: 10,
      wrongLetters: [],
      wrongWords: []
    };

    this.gameStates.set(guildId, newGameState);
    return generateGameEmbed(newGameState);
  }

  private handleGuess(guildId: string, guess: string): MessageType {
    const gameState = this.gameStates.get(guildId);
    const gameRunning = isGameActive(gameState);
    if (!gameRunning) {
      return 'ikke startet';
    }

    const isWord = guess.length > 1;
    if (isWord) {
      return this.onGuessWord(guildId, guess);
    }

    return this.onGuessLetter(guildId, guess);
  }

  private onGuessWord(guildId: string, guess: string): MessageType {
    const invalidWordRegex = /[^A-Z]+/;
    if (invalidWordRegex.test(guess)) {
      return 'That’s not a word I can use here.';
    }

    // Grab a reference
    const gameState = this.gameStates.get(guildId);

    if (guess.length !== gameState.currentWord.length) {
      const wordText = `${gameState.currentWord.length}`;
      return `Your guess has ${guess.length} letters, the word has ${wordText}. Think about that for a while.`;
    }

    if (guess === gameState.currentWord) {
      gameState.currentDisplay = gameState.currentWord;
      return `Yup, it’s “${guess}”`;
    }

    if (gameState.wrongWords.indexOf(guess) !== -1) {
      return 'You’ve already guessed that one!';
    }

    gameState.livesRemaining -= 1;
    gameState.wrongWords.push(guess);

    if (gameState.livesRemaining <= 0) {
      return `You’ve lost! The word was “${gameState.currentWord}”`;
    }

    return generateGameEmbed(gameState);
  }

  private onGuessLetter(guildId: string, guess: string): MessageType {
    if (!guess.match(/[A-Z]/)) {
      return 'That’s not a letter I can use…';
    }

    // Grab a reference
    const gameState = this.gameStates.get(guildId);

    if (gameState.currentWord.indexOf(guess) === -1) {
      if (gameState.wrongLetters.includes(guess)) {
        return 'You’ve already guessed that!';
      }

      gameState.wrongLetters.push(guess);
      gameState.livesRemaining -= 1;

      if (gameState.livesRemaining > 0) {
        return `Nope, there’s no “${guess}”. You’ve got ${gameState.livesRemaining} chances remaining!`;
      }

      return `Bad luck! The word was “${gameState.currentWord}”`;
    }

    // Copy the letter into the display variable
    for (let index = 0; index < gameState.currentDisplay.length; index += 1) {
      const currentLetter = gameState.currentDisplay[index];
      if (currentLetter !== blankDisplayChar) {
        continue;
      }

      if (gameState.currentWord[index] !== guess) {
        continue;
      }

      const lettersBefore = gameState.currentDisplay.substring(0, index);
      const lettersAfter = gameState.currentDisplay.substring(index + 1);
      gameState.currentDisplay = `${lettersBefore}${guess}${lettersAfter}`;
    }

    if (gameState.currentWord === gameState.currentDisplay) {
      return `Yup, it’s “${gameState.currentWord}”`;
    }

    return generateGameEmbed(gameState);
  }

  private handleBlankCommand(guildId: string): Promise<MessageType> {
    const state = this.gameStates.get(guildId);
    if (!state) {
      const message =
        'No game has been played - try starting one with `+hm start`';
      return Promise.resolve(message);
    }

    return Promise.resolve(generateGameEmbed(state));
  }
}
