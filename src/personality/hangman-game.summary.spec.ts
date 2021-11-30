import { Guild, Message, MessageEmbed } from 'discord.js';
import { IMock, It, Mock } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';
import { blankDisplayChar, guessCommand, prefix, sqlCollection, statsCommand, summaryCommand } from './constants/hangman-game';
import * as embeds from './embeds/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockActiveGame, mockGuildId } from './hangman-game.specdata';
import { GameData, SerialisableGameData } from './interfaces/hangman-game';
import { deserialiseGameData, serialiseGameData } from './utilities/hangman-game';

describe('Hangman Game - summary feature behaviour', () => {
  let personality: HangmanGame;
  let mockGuild: IMock<Guild>;
  let mockMessage: IMock<Message>;
  let mockLogger: IMock<Logger>;
  let mockDatabase: IMock<Database>;

  const beforeState = mockActiveGame;
  let afterState: GameData;

  beforeEach(() => {
    // Personality deps
    mockLogger = Mock.ofType<Logger>();
    mockDatabase = Mock.ofType<Database>();

    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup(m => m.id).returns(() => mockGuildId);

    const mockDeps = Mock.ofType<DependencyContainer>();
    mockDeps.setup(m => m.logger).returns(() => mockLogger.object);
    mockDeps.setup(m => m.database).returns(() => mockDatabase.object);

    personality = new HangmanGame(mockDeps.object);

    // Test deps
    mockMessage = Mock.ofType<Message>();
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);

    const runningGame = serialiseGameData(beforeState);
    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isValue(sqlCollection), It.isAny()))
      .returns(() => Promise.resolve([runningGame]));

    afterState = null;
    mockDatabase
      .setup(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()))
      .callback((_: string, fields: KeyedObject) => {
        afterState = deserialiseGameData(fields as SerialisableGameData);
      })
      .returns(() => Promise.resolve());
  });

  describe('Game summary', () => {
    beforeEach(() => {
      mockMessage.setup(s => s.content).returns(() => `${prefix} ${summaryCommand}`);
    });

    it('should return embed', done => {
      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeInstanceOf(MessageEmbed);
        done();
      });
    });

    it('should generate embed using appropriate embed generator', done => {
      const embedGenSpy = spyOn(embeds, 'generateGameEmbed').and.callThrough();

      personality.onMessage(mockMessage.object).then(() => {
        expect(embedGenSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Statistics summary and behaviour', () => {
    it('should call embed generator', done => {
      const embedGenSpy = spyOn(embeds, 'generateStatsEmbed');

      mockMessage.setup(s => s.content).returns(() => `${prefix} ${statsCommand}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(embedGenSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should add to total wins and win streak if won by word guess', done => {
      const startWins = beforeState.totalWins;
      const startStreak = beforeState.currentStreak;
      mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${beforeState.currentWord}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(afterState.totalWins).toBe(startWins + 1);
        expect(afterState.currentStreak).toBe(startStreak + 1);
        done();
      });
    });

    // Assumption from test - running game has one unguessed letter that will
    // win the game when guessed
    it('should add to total wins and win streak if won by letter guess', done => {
      const startWins = beforeState.totalWins;
      const startStreak = beforeState.currentStreak;
      const letterToGuess = beforeState.currentWord[beforeState.currentDisplay.indexOf(blankDisplayChar)];

      mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${letterToGuess}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(afterState.totalWins).toBe(startWins + 1);
        expect(afterState.currentStreak).toBe(startStreak + 1);
        done();
      });
    });

    // Assumption from test - the word contains the letter A so that the
    // incorrect guess can be generated
    it('should add to total losses and clear streak if lost by word guess', done => {
      // Regenerate running state to have expected state
      mockDatabase.reset();
      const runningGame = serialiseGameData(beforeState);
      runningGame.livesRemaining = 1;
      mockDatabase
        .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isValue(sqlCollection), It.isAny()))
        .returns(() => Promise.resolve([runningGame]));
      mockDatabase
        .setup(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()))
        .callback((_: string, fields: KeyedObject) => {
          afterState = deserialiseGameData(fields as SerialisableGameData);
        })
        .returns(() => Promise.resolve());

      // Do test
      const startLosses = runningGame.totalLosses;
      const badGuess = runningGame.currentWord.replace('A', 'Z');
      mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${badGuess}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(afterState.totalLosses).toBe(startLosses + 1);
        expect(afterState.currentStreak).toBe(0);
        done();
      });
    });

    // Assumption from test - the word does not contain the letter Z so that the
    // incorrect guess can be generated
    it('should add to total losses and clear streak if lost by letter guess', done => {
      // Regenerate running state to have expected state
      mockDatabase.reset();
      const runningGame = serialiseGameData(beforeState);
      runningGame.livesRemaining = 1;
      mockDatabase
        .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isValue(sqlCollection), It.isAny()))
        .returns(() => Promise.resolve([runningGame]));
      mockDatabase
        .setup(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()))
        .callback((_: string, fields: KeyedObject) => {
          afterState = deserialiseGameData(fields as SerialisableGameData);
        })
        .returns(() => Promise.resolve());

      // Do test
      const startLosses = runningGame.totalLosses;
      const badGuess = 'Z';
      mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${badGuess}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(afterState.totalLosses).toBe(startLosses + 1);
        expect(afterState.currentStreak).toBe(0);
        done();
      });
    });

    // Assumption from test - there are lives remaining and the word contains
    // the letter A so that the incorrect guess can be generated
    it('should not change statistics on incorrect word guess with lives remaining', done => {
      const startLives = beforeState.livesRemaining;
      const startLosses = beforeState.totalLosses;
      const startStreak = beforeState.currentStreak;
      const badGuess = beforeState.currentWord.replace('A', 'Z');

      mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${badGuess}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(afterState.totalLosses).toBe(startLosses);
        expect(afterState.currentStreak).toBe(startStreak);

        // Check guess was made - lives changed
        expect(afterState.livesRemaining).toBe(startLives - 1);

        done();
      });
    });

    // Assumption from test - there are lives remaining and the word does not
    // contain the letter Z so that the incorrect guess can be generated
    it('should not change statistics on incorrect word guess with lives remaining', done => {
      const startLives = beforeState.livesRemaining;
      const startLosses = beforeState.totalLosses;
      const startStreak = beforeState.currentStreak;
      const badGuess = 'Z';

      mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${badGuess}`);

      personality.onMessage(mockMessage.object).then(() => {
        expect(afterState.totalLosses).toBe(startLosses);
        expect(afterState.currentStreak).toBe(startStreak);

        // Check guess was made - lives changed
        expect(afterState.livesRemaining).toBe(startLives - 1);

        done();
      });
    });
  });
});
