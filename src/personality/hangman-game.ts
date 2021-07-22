import { Message, MessageEmbed } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';
import { apiUrl, blankDisplayChar, guessCommand, prefix, startCommand, statsCommand } from './constants/hangman-game';
import { generateGameEmbed, generateHelpEmbed, generateStatsEmbed } from './embeds/hangman-game';
import { GameData, GameState, GameStatistics, WordData } from './interfaces/hangman-game';
import { isGameActive } from './utilities/hangman-game';

export class HangmanGame implements Personality {
  protected gameData: Map<string, GameData>;

  constructor(private dependencies: DependencyContainer) {
    this.gameData = new Map<string, GameData>();
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

    if (text.startsWith(statsCommand)) {
      return this.handleSummaryCommand(message.guild.id, generateStatsEmbed);
    }

    return this.handleSummaryCommand(message.guild.id, generateGameEmbed);
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve(generateHelpEmbed());
  }

  private handleGameStart(guildId: string): Promise<MessageType> {
    const guildGame = this.gameData.get(guildId);
    if (guildGame && isGameActive(guildGame.state)) {
      return Promise.resolve('Game is already running');
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

  /**
   * Begins a new game of Hangman
   *
   * @param guildId the id of the guild the request originated from
   * @param data word data from API
   * @returns an embed with the new game information
   */
  private handleWordResponse(guildId: string, data: WordData): MessageType {
    if (!data || !data.word) {
      return 'Could not load word';
    }

    let statistics: GameStatistics;
    const currentData = this.gameData.get(guildId);
    if (currentData) {
      statistics = currentData.statistics;
    } else {
      statistics = {
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0
      };
    }

    const state: GameState = {
      timeStarted: Date.now(),
      currentWord: data.word.toUpperCase(),
      currentDisplay: Array(data.word.length).fill('-').join(''),
      livesRemaining: 10,
      wrongLetters: [],
      wrongWords: []
    };

    const updatedData = { state, statistics };
    this.gameData.set(guildId, updatedData);
    return generateGameEmbed(updatedData);
  }

  /**
   * Wrapper function to handle guessing of letters or words
   *
   * @param guildId the id of the guild the request originated from
   * @param guess letter or word guessed
   * @returns game information or help texts
   */
  private handleGuess(guildId: string, guess: string): MessageType {
    const gameData = this.gameData.get(guildId);
    const gameRunning = gameData && isGameActive(gameData.state);
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

    // Grab a reference to the game data
    const gameData = this.gameData.get(guildId);
    const { state, statistics } = gameData;

    if (guess.length !== state.currentWord.length) {
      const wordText = `${state.currentWord.length}`;
      return `Your guess has ${guess.length} letters, the word has ${wordText}. Think about that for a while.`;
    }

    if (guess === state.currentWord) {
      state.currentDisplay = state.currentWord;
      statistics.currentStreak += 1;
      statistics.totalWins += 1;
      return `Yup, it’s “${guess}”`;
    }

    if (state.wrongWords.indexOf(guess) !== -1) {
      return 'That’s already been guessed.';
    }

    state.livesRemaining -= 1;
    state.wrongWords.push(guess);

    if (state.livesRemaining <= 0) {
      statistics.currentStreak = 0;
      statistics.totalLosses += 1;
      return `You’ve lost! The word was “${state.currentWord}”`;
    }

    return generateGameEmbed(gameData);
  }

  private onGuessLetter(guildId: string, guess: string): MessageType {
    if (!guess.match(/[A-Z]/)) {
      return 'That’s not a letter I can use…';
    }

    // Grab a reference to the game data
    const gameData = this.gameData.get(guildId);
    const { state, statistics } = gameData;

    if (state.currentWord.indexOf(guess) === -1) {
      if (state.wrongLetters.includes(guess)) {
        return 'This letter’s already been guessed!';
      }

      state.wrongLetters.push(guess);
      state.wrongLetters.sort();
      state.livesRemaining -= 1;

      if (state.livesRemaining > 0) {
        return `Nope, there’s no “${guess}”. You’ve got ${state.livesRemaining} chances remaining!`;
      }

      statistics.currentStreak = 0;
      statistics.totalLosses += 1;
      return `Bad luck! The word was “${state.currentWord}”`;
    }

    if (state.currentDisplay.indexOf(guess) >= 0) {
      return 'This letter’s already been guessed!';
    }

    // Copy the letter into the display variable
    for (let index = 0; index < state.currentDisplay.length; index += 1) {
      const currentLetter = state.currentDisplay[index];
      if (currentLetter !== blankDisplayChar) {
        continue;
      }

      if (state.currentWord[index] !== guess) {
        continue;
      }

      const lettersBefore = state.currentDisplay.substring(0, index);
      const lettersAfter = state.currentDisplay.substring(index + 1);
      state.currentDisplay = `${lettersBefore}${guess}${lettersAfter}`;
    }

    if (state.currentWord === state.currentDisplay) {
      statistics.currentStreak += 1;
      statistics.totalWins += 1;
      return `Yup, it’s “${state.currentWord}”`;
    }

    return generateGameEmbed(gameData);
  }

  private handleSummaryCommand(
    guildId: string,
    embedGen: (input: GameData) => MessageEmbed
  ): Promise<MessageType> {
    const data = this.gameData.get(guildId);
    if (!data) {
      const message =
        'No game has been played - try starting one with `+hm start`';
      return Promise.resolve(message);
    }

    return Promise.resolve(embedGen(data));
  }
}
