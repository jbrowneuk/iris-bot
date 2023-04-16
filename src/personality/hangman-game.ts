import * as axios from 'axios';
import { Message, MessageEmbed } from 'discord.js';
import { StatusCodes } from 'http-status-codes';

import { QueryFilter } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';
import {
  apiUrl,
  blankDisplayChar,
  dictionaryCommand,
  guessCommand,
  prefix,
  sqlCollection,
  startCommand,
  statsCommand,
  summaryCommand
} from './constants/hangman-game';
import { generateDictionaryEmbed, generateGameEmbed, generateGameEndMesage, generateHelpEmbed, generateStatsEmbed } from './embeds/hangman-game';
import { DictionaryInfo, GameData, SerialisableGameData, WordData } from './interfaces/hangman-game';
import { deserialiseGameData, isGameActive, serialiseGameData } from './utilities/hangman-game';

export class HangmanGame implements Personality {
  constructor(private dependencies: DependencyContainer) {}

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
      return this.handleGuess(message.guild.id, guess);
    }

    if (text.startsWith(statsCommand)) {
      return this.handleSummaryCommand(message.guild.id, generateStatsEmbed);
    }

    if (text.startsWith(summaryCommand)) {
      return this.handleSummaryCommand(message.guild.id, generateGameEmbed);
    }

    if (text.startsWith(dictionaryCommand)) {
      return this.handleDictionaryRequest();
    }

    return this.onHelp();
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve(generateHelpEmbed());
  }

  private fetchWordFromApi(): Promise<WordData> {
    return axios.default.get<WordData>(apiUrl).then(response => {
      if (response.status !== StatusCodes.OK) {
        throw new Error(`Unable to fetch API: ${response.status}`);
      }

      return response.data;
    });
  }

  private fetchGameForGuild(guildId: string): Promise<GameData> {
    const filter: QueryFilter = {
      where: [{ field: 'guildId', value: guildId }]
    };

    return this.dependencies.database.getRecordsFromCollection<SerialisableGameData>(sqlCollection, filter).then(records => {
      if (records.length === 0) {
        return null;
      }

      return deserialiseGameData(records[0]);
    });
  }

  private initialiseGameForGuild(guildId: string, gameData: GameData): Promise<void> {
    const serialised = serialiseGameData(gameData);
    const insertData = { guildId, ...serialised };

    return this.dependencies.database.insertRecordsToCollection(sqlCollection, insertData);
  }

  private updateGameForGuild(guildId: string, gameData: GameData): Promise<void> {
    const filter = { $guildId: guildId };
    const serialised = serialiseGameData(gameData);

    return this.dependencies.database.updateRecordsInCollection(sqlCollection, serialised, filter);
  }

  private handleGameStart(guildId: string): Promise<MessageType> {
    return this.fetchGameForGuild(guildId).then(guildData => {
      if (guildData && isGameActive(guildData)) {
        return 'Game is already running';
      }

      return this.fetchWordFromApi()
        .then(rawData => this.handleWordResponse(guildId, rawData, guildData))
        .catch(e => {
          this.dependencies.logger.error(e);
          return 'My internet is not working right now.';
        });
    });
  }

  /**
   * Begins a new game of Hangman
   *
   * @param guildId the id of the guild the request originated from
   * @param wordData word data from API
   * @param guildData the current guild's game state
   * @returns a promise resolving to an embed with the new game information
   */
  private handleWordResponse(guildId: string, wordData: WordData, guildData: GameData): Promise<MessageType> {
    if (!wordData || !wordData.word) {
      // TODO Use response generator
      return Promise.resolve('Could not think of a word');
    }

    const newGame: Omit<GameData, 'totalWins' | 'totalLosses' | 'currentStreak'> = {
      timeStarted: Date.now(),
      currentWord: wordData.word.toUpperCase(),
      currentDisplay: Array(wordData.word.length).fill(blankDisplayChar).join(''),
      livesRemaining: 10,
      wrongLetters: [],
      wrongWords: []
    };

    if (guildData) {
      const gameData = { ...guildData, ...newGame };

      return this.updateGameForGuild(guildId, gameData).then(() => generateGameEmbed(gameData));
    } else {
      const gameData = {
        ...newGame,
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0
      };

      return this.initialiseGameForGuild(guildId, gameData).then(() => generateGameEmbed(gameData));
    }
  }

  /**
   * Wrapper function to handle guessing of letters or words
   *
   * @param guildId the id of the guild the request originated from
   * @param guess letter or word guessed
   * @returns game information or help texts
   */
  private handleGuess(guildId: string, guess: string): Promise<MessageType> {
    return this.fetchGameForGuild(guildId)
      .then(gameData => {
        const gameRunning = gameData && isGameActive(gameData);
        if (!gameRunning) {
          return `The game hasn’t been started. Try starting one with \`${prefix} ${startCommand}\``;
        }

        const isWord = guess.length > 1;
        if (isWord) {
          return this.onGuessWord(guildId, guess, gameData);
        }

        return this.onGuessLetter(guildId, guess, gameData);
      })
      .catch(e => {
        this.dependencies.logger.error(e);
        return 'Not doing that now';
      });
  }

  private onGuessWord(guildId: string, guess: string, gameData: GameData): Promise<MessageType> {
    const invalidWordRegex = /[^A-Z]+/;
    if (invalidWordRegex.test(guess)) {
      return Promise.resolve('That’s not a word I can use here.');
    }

    if (guess.length !== gameData.currentWord.length) {
      const wordText = `Your guess has ${guess.length} letters, the word has ${gameData.currentWord.length}.`;
      return Promise.resolve(wordText);
    }

    if (guess === gameData.currentWord) {
      gameData.currentDisplay = gameData.currentWord;
      gameData.currentStreak += 1;
      gameData.totalWins += 1;

      return this.updateGameForGuild(guildId, gameData).then(() => generateGameEndMesage(gameData));
    }

    if (gameData.wrongWords.indexOf(guess) !== -1) {
      return Promise.resolve('That’s already been guessed.');
    }

    gameData.livesRemaining -= 1;
    gameData.wrongWords.push(guess);

    if (gameData.livesRemaining <= 0) {
      gameData.currentStreak = 0;
      gameData.totalLosses += 1;

      return this.updateGameForGuild(guildId, gameData).then(() => generateGameEndMesage(gameData));
    }

    return this.updateGameForGuild(guildId, gameData).then(() => ({
      content: `Nope, it’s not “${guess}”`,
      embeds: [generateGameEmbed(gameData, false)]
    }));
  }

  private onGuessLetter(guildId: string, guess: string, gameData: GameData): Promise<MessageType> {
    if (!guess.match(/[A-Z]/)) {
      return Promise.resolve('That’s not a letter I can use…');
    }

    if (gameData.currentWord.indexOf(guess) === -1) {
      if (gameData.wrongLetters.includes(guess)) {
        return Promise.resolve('This letter’s already been guessed!');
      }

      gameData.wrongLetters.push(guess);
      gameData.wrongLetters.sort();
      gameData.livesRemaining -= 1;

      if (gameData.livesRemaining > 0) {
        return this.updateGameForGuild(guildId, gameData).then(() => ({
          content: `Nope, there’s no “${guess}”`,
          embeds: [generateGameEmbed(gameData, false)]
        }));
      }

      gameData.currentStreak = 0;
      gameData.totalLosses += 1;

      return this.updateGameForGuild(guildId, gameData).then(() => generateGameEndMesage(gameData));
    }

    if (gameData.currentDisplay.indexOf(guess) >= 0) {
      return Promise.resolve('This letter’s already been guessed!');
    }

    // Copy the letter into the display variable
    for (let index = 0; index < gameData.currentDisplay.length; index += 1) {
      const currentLetter = gameData.currentDisplay[index];
      if (currentLetter !== blankDisplayChar) {
        continue;
      }

      if (gameData.currentWord[index] !== guess) {
        continue;
      }

      const lettersBefore = gameData.currentDisplay.substring(0, index);
      const lettersAfter = gameData.currentDisplay.substring(index + 1);
      gameData.currentDisplay = `${lettersBefore}${guess}${lettersAfter}`;
    }

    if (gameData.currentWord === gameData.currentDisplay) {
      gameData.currentStreak += 1;
      gameData.totalWins += 1;

      return this.updateGameForGuild(guildId, gameData).then(() => generateGameEndMesage(gameData));
    }

    return this.updateGameForGuild(guildId, gameData).then(() => generateGameEmbed(gameData));
  }

  private handleSummaryCommand(guildId: string, embedGen: (input: GameData) => MessageEmbed): Promise<MessageType> {
    return this.fetchGameForGuild(guildId).then(gameData => {
      if (!gameData) {
        return `No game has been played - try starting one with \`${prefix} ${startCommand}\``;
      }

      return embedGen(gameData);
    });
  }

  private handleDictionaryRequest(): Promise<MessageType> {
    return axios.default.get<DictionaryInfo>(`${apiUrl}?stats`).then(response => {
      if (response.status !== StatusCodes.OK) {
        throw new Error(`Unable to fetch API: ${response.status}`);
      }

      return generateDictionaryEmbed(response.data);
    });
  }
}
