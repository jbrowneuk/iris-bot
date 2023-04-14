import * as axios from 'axios';
import { Guild, Message, MessageEmbed } from 'discord.js';
import { StatusCodes } from 'http-status-codes';
import { IMock, Mock } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { dictionaryCommand, prefix } from './constants/hangman-game';
import * as embeds from './embeds/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockGuildId } from './hangman-game.specdata';

describe('Hangman Game - dictionary summary functionality', () => {
  let personality: HangmanGame;
  let mockGuild: IMock<Guild>;
  let mockMessage: IMock<Message>;
  let mockLogger: IMock<Logger>;
  let mockDatabase: IMock<Database>;

  beforeEach(() => {
    mockLogger = Mock.ofType<Logger>();
    mockDatabase = Mock.ofType<Database>();

    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup(m => m.id).returns(() => mockGuildId);

    const mockDeps = Mock.ofType<DependencyContainer>();
    mockDeps.setup(m => m.logger).returns(() => mockLogger.object);
    mockDeps.setup(m => m.database).returns(() => mockDatabase.object);

    personality = new HangmanGame(mockDeps.object);

    mockMessage = Mock.ofType<Message>();
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);
    mockMessage.setup(s => s.content).returns(() => `${prefix} ${dictionaryCommand}`);
  });

  let fetchSpy: jest.SpyInstance;
  let embedSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(axios.default, 'get');
    embedSpy = jest.spyOn(embeds, 'generateDictionaryEmbed').mockImplementation(() => ({} as MessageEmbed));
  });

  it(`should generate embed on ${dictionaryCommand} command and fetched successfully`, done => {
    const mockFetchResponse = {
      status: StatusCodes.OK,
      data: ''
    };

    fetchSpy.mockReturnValue(Promise.resolve(mockFetchResponse));

    personality.onMessage(mockMessage.object).then(() => {
      expect(embedSpy).toHaveBeenCalled();
      done();
    });
  });

  it(`should return error on ${dictionaryCommand} command and unable to fetch`, done => {
    const mockFetchResponse = {
      status: StatusCodes.NOT_FOUND
    };

    fetchSpy.mockReturnValue(Promise.resolve(mockFetchResponse));

    personality.onMessage(mockMessage.object).catch(() => {
      expect(embedSpy).not.toHaveBeenCalled();
      done();
    });
  });
});
