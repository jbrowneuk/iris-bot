import { Guild, Message } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';
import { guessCommand, prefix, sqlCollection } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockActiveGame, mockGuildId } from './hangman-game.specdata';
import { GameData, SerialisableGameData } from './interfaces/hangman-game';
import { deserialiseGameData, serialiseGameData } from './utilities/hangman-game';

describe('Hangman Game - guessing behaviour for words', () => {
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
    // Update state happens when a guess is made
    afterState = null;
    mockDatabase
      .setup(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()))
      .callback((collection: string, fields: KeyedObject) => {
        afterState = deserialiseGameData(fields as SerialisableGameData);
      })
      .returns(() => Promise.resolve());

    mockMessage = Mock.ofType<Message>();
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);

    const runningGame = serialiseGameData(beforeState);
    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isValue(sqlCollection), It.isAny()))
      .returns(() => Promise.resolve([runningGame]));
  });

  it('should complete display variable with correct guess', done => {
    const guessWord = 'baffle';
    const guessWordUC = guessWord.toUpperCase();

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessWord}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.currentDisplay).toBe(guessWordUC);
      done();
    });
  });

  it('should add incorrect guess to wrong words array', done => {
    const guessWord = 'bottle';
    const guessWordUC = guessWord.toUpperCase();

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessWord}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.wrongWords).toContain(guessWordUC);
      done();
    });
  });

  it('should respond with message about the guess being wrong on incorrect guess', done => {
    const guessWord = 'bottle';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessWord}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain(guessWord.toUpperCase());
      done();
    });
  });

  it('should not duplicate an incorrect word', done => {
    const guessWord = beforeState.wrongWords[0];

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessWord}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain('already been guessed');

      // Shouldn't insert or update state
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()), Times.never());
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isValue(sqlCollection), It.isAny()), Times.never());

      done();
    });
  });

  it('should not accept word with symbol character', done => {
    const guessWord = 'b#ffle';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessWord}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain('not a word');

      // Shouldn't insert or update state
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()), Times.never());
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isValue(sqlCollection), It.isAny()), Times.never());

      done();
    });
  });

  it('should not accept word with numeric character', done => {
    const guessWord = 'b0ffle';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessWord}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain('not a word');

      // Shouldn't insert or update state
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()), Times.never());
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isValue(sqlCollection), It.isAny()), Times.never());

      done();
    });
  });
});
