import { Guild, Message } from 'discord.js';
import { IMock, Mock } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { prefix } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockGuildId } from './hangman-game.specdata';

describe('Hangman Game - default behaviour', () => {
  let personality: HangmanGame;
  let mockGuild: IMock<Guild>;
  let mockMessage: IMock<Message>;
  let mockLogger: IMock<Logger>;
  let mockDatabase: IMock<Database>;

  beforeEach(() => {
    mockLogger = Mock.ofType<Logger>();
    mockDatabase = Mock.ofType<Database>();

    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup((m) => m.id).returns(() => mockGuildId);

    const mockDeps = Mock.ofType<DependencyContainer>();
    mockDeps.setup((m) => m.logger).returns(() => mockLogger.object);
    mockDeps.setup((m) => m.database).returns(() => mockDatabase.object);

    personality = new HangmanGame(mockDeps.object);
  });

  it('should create', () => {
    expect(personality).toBeTruthy();
  });

  it('should provide help if command given with no parameters', (done) => {
    mockMessage = Mock.ofType<Message>();
    mockMessage.setup((s) => s.guild).returns(() => mockGuild.object);
    mockMessage.setup((s) => s.content).returns(() => prefix);

    const helpSpy = spyOn(personality, 'onHelp').and.callThrough();
    personality.onMessage(mockMessage.object).then(() => {
      expect(helpSpy).toHaveBeenCalled();
      done();
    });
  });

  describe('Help functionality', () => {
    it('should respond with help message', (done) => {
      personality.onHelp().then((response) => {
        expect(response).toBeTruthy();
        done();
      });
    });
  });
});
