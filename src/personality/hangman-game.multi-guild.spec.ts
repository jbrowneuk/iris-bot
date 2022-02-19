import * as axios from 'axios';
import { Guild, Message } from 'discord.js';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock } from 'typemoq';

import { Database, QueryFilter } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';
import { guessCommand, prefix, startCommand } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockActiveGame, mockGuildId, mockWord } from './hangman-game.specdata';
import { SerialisableGameData } from './interfaces/hangman-game';
import { serialiseGameData } from './utilities/hangman-game';

const altGuildId = 'myaltguild';

describe('Hangman Game - multiple guild behaviour', () => {
  let fetchSpy: jasmine.Spy;
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
    mockMessage = Mock.ofType<Message>();

    const mockDeps = Mock.ofType<DependencyContainer>();
    mockDeps.setup(m => m.logger).returns(() => mockLogger.object);
    mockDeps.setup(m => m.database).returns(() => mockDatabase.object);

    personality = new HangmanGame(mockDeps.object);

    // Test deps
    const mockFetchResponse = {
      status: StatusCodes.OK,
      data: mockWord
    };

    fetchSpy = spyOn(axios.default, 'get');
    fetchSpy.and.returnValue(Promise.resolve(mockFetchResponse));
  });

  it('should not affect existing game if new one started in alternate guild', done => {
    mockGuild.setup(m => m.id).returns(() => mockGuildId);
    mockMessage.setup(s => s.content).returns(() => `${prefix} ${startCommand}`);
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);

    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isAny(), It.isAny()))
      .returns((c: string, filter: QueryFilter) => {
        if (filter.where[0].value === altGuildId) {
          return Promise.resolve([serialiseGameData(mockActiveGame)]);
        }

        return Promise.resolve([]);
      });

    let lastGuildId = altGuildId;
    mockDatabase
      .setup(m => m.insertRecordsToCollection(It.isAny(), It.isAny()))
      .returns((c: string, value: KeyedObject) => {
        lastGuildId = value.guildId;
        return Promise.resolve();
      });

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toBeTruthy();
      expect(lastGuildId).toBe(mockGuildId);

      done();
    });
  });

  it('should not affect existing game if guess happens in an alternate guild', done => {
    mockGuild.setup(m => m.id).returns(() => altGuildId);
    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} z`);
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);

    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isAny(), It.isAny()))
      .returns(() => Promise.resolve([serialiseGameData(mockActiveGame)]));

    let lastGuildId = mockGuildId;
    mockDatabase
      .setup(m => m.updateRecordsInCollection(It.isAny(), It.isAny(), It.isAny()))
      .returns((c: string, v: KeyedObject, where: KeyedObject) => {
        lastGuildId = where.$guildId;
        return Promise.resolve();
      });

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toBeTruthy();
      expect(lastGuildId).toBe(altGuildId);

      done();
    });
  });
});
