import * as axios from 'axios';
import { Guild, Message } from 'discord.js';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock, Times } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';
import { apiUrl, blankDisplayChar, prefix, sqlCollection, startCommand } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockActiveGame, mockCompleteGame, mockGuildId, mockWord } from './hangman-game.specdata';
import { SerialisableGameData } from './interfaces/hangman-game';
import { serialiseGameData } from './utilities/hangman-game';

describe('Hangman Game - start game behaviour', () => {
  let fetchSpy: jest.SpyInstance;
  let personality: HangmanGame;
  let mockGuild: IMock<Guild>;
  let mockMessage: IMock<Message>;
  let mockLogger: IMock<Logger>;
  let mockDatabase: IMock<Database>;

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
    const mockFetchResponse = {
      status: StatusCodes.OK,
      data: mockWord
    };

    fetchSpy = jest.spyOn(axios.default, 'get');
    fetchSpy.mockReturnValue(Promise.resolve(mockFetchResponse));

    mockMessage = Mock.ofType<Message>();
    mockMessage.setup(s => s.content).returns(() => `${prefix} ${startCommand}`);
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);
  });

  it('should fetch word on start command if no game running', done => {
    let serialisedGameData: KeyedObject;

    mockDatabase.setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isAny(), It.isAny())).returns(() => Promise.resolve([]));

    mockDatabase
      .setup(m => m.insertRecordsToCollection(It.isAnyString(), It.isAny()))
      .callback((_: string, data: KeyedObject) => {
        serialisedGameData = data;
      });

    personality.onMessage(mockMessage.object).then(() => {
      expect(fetchSpy).toHaveBeenCalledWith(apiUrl);

      expect(serialisedGameData.currentWord).toBe(mockWord.word.toUpperCase());

      done();
    });
  });

  it('should add game data for guild on start if not existing', done => {
    let collectionName: string;
    let serialisedGameData: KeyedObject;

    mockDatabase.setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isAny(), It.isAny())).returns(() => Promise.resolve([]));

    mockDatabase
      .setup(m => m.insertRecordsToCollection(It.isAnyString(), It.isAny()))
      .callback((collection: string, data: KeyedObject) => {
        collectionName = collection;
        serialisedGameData = data;
      });

    personality.onMessage(mockMessage.object).then(() => {
      expect(collectionName).toBe(sqlCollection);
      expect(serialisedGameData.guildId).toBe(mockGuildId);

      done();
    });
  });

  it('should update game data for guild on start if guild exists with finished game', done => {
    let collectionName: string;
    let serialisedGameData: SerialisableGameData;
    let queryFilter: KeyedObject;

    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isAny(), It.isAny()))
      .returns(() => Promise.resolve([serialiseGameData(mockCompleteGame)]));

    mockDatabase
      .setup(m => m.updateRecordsInCollection(It.isAnyString(), It.isAny(), It.isAny()))
      .callback((collection: string, data: SerialisableGameData, filter: KeyedObject) => {
        collectionName = collection;
        serialisedGameData = data;
        queryFilter = filter;
      });

    personality.onMessage(mockMessage.object).then(() => {
      expect(collectionName).toBe(sqlCollection);
      expect(queryFilter.$guildId).toBe(mockGuildId);

      expect(serialisedGameData.currentWord).not.toBe(mockCompleteGame.currentWord);

      expect(serialisedGameData.wrongLetters).toBe('');
      expect(serialisedGameData.wrongWords).toBe('');

      const regex = new RegExp(blankDisplayChar, 'g');

      const display = serialisedGameData.currentDisplay;
      const charCount = display.match(regex)?.length;
      expect(charCount).toBe(display.length);

      done();
    });
  });

  it('should not start a game if one is in progress', done => {
    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isAny(), It.isAny()))
      .returns(() => Promise.resolve([serialiseGameData(mockActiveGame)]));

    personality.onMessage(mockMessage.object).then(() => {
      expect(fetchSpy).not.toHaveBeenCalled();

      // No inserting
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isAny(), It.isAny()), Times.never());

      // No updating
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isAny(), It.isAny(), It.isAny()), Times.never());

      done();
    });
  });
});
