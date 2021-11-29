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

  // describe('Settings persistence', () => {
  //   const hydratedData: GameData = {
  //     currentWord: 'HELLO',
  //     currentDisplay: '-E--O',
  //     timeStarted: 1024768,
  //     livesRemaining: 9,
  //     wrongLetters: ['P'],
  //     wrongWords: [],
  //     totalWins: 4,
  //     totalLosses: 1,
  //     currentStreak: 2
  //   };

  //   const serialisedString = JSON.stringify([[mockGuildId, hydratedData]]);

  //   let readSpy: jasmine.Spy;
  //   let writeSpy: jasmine.Spy;

  //   function fakeReadSuccess(
  //     name: string,
  //     enc: string,
  //     cb: (err: NodeJS.ErrnoException, data: string) => void
  //   ) {
  //     expect(name).toBeTruthy();
  //     expect(enc).toBe('utf-8');
  //     cb(null, serialisedString);
  //   }

  //   function fakeReadFail(
  //     name: string,
  //     enc: string,
  //     cb: (err: NodeJS.ErrnoException, data: string) => void
  //   ) {
  //     expect(name).toBeTruthy();
  //     expect(enc).toBe('utf-8');
  //     cb(new Error('mock'), undefined);
  //   }

  //   function fakeWriteSuccess(name: string, data: string, enc: string) {
  //     expect(name).toBeTruthy();
  //     expect(data).toBe(serialisedString);
  //     expect(enc).toBe('utf-8');
  //   }

  //   function fakeWriteFail(name: string, data: string, enc: string) {
  //     expect(name).toBeTruthy();
  //     expect(data).toBe(serialisedString);
  //     expect(enc).toBe('utf-8');

  //     throw new Error('mock error');
  //   }

  //   beforeEach(() => {
  //     readSpy = spyOn(fs, 'readFile');
  //     writeSpy = spyOn(fs, 'writeFileSync');
  //   });

  //   it('should load settings on initialise', (done) => {
  //     readSpy.and.callFake(fakeReadSuccess);

  //     personality.initialise();

  //     setTimeout(() => {
  //       const dataForGuild = personality.gameDataMap.get(mockGuildId);
  //       expect(dataForGuild).toBeTruthy();

  //       const state = dataForGuild.state;
  //       expect(state).toBeTruthy();
  //       expect(state.currentDisplay).toBe(hydratedData.state.currentDisplay);

  //       const stats = dataForGuild.statistics;
  //       expect(stats).toBeTruthy();
  //       expect(stats.totalWins).toBe(hydratedData.statistics.totalWins);
  //       done();
  //     });
  //   });

  //   it('should generate blank data if load fails on initialise', (done) => {
  //     readSpy.and.callFake(fakeReadFail);

  //     personality.initialise();

  //     setTimeout(() => {
  //       expect(personality.gameDataMap).toBeTruthy();
  //       expect(personality.gameDataMap.size).toBe(0);
  //       done();
  //     });
  //   });

  //   it('should persist settings on destroy', () => {
  //     writeSpy.and.callFake(fakeWriteSuccess);

  //     personality.gameDataMap.set(mockGuildId, hydratedData);
  //     personality.destroy();

  //     expect(writeSpy).toHaveBeenCalled();
  //   });

  //   it('should log error if unable to persist settings on destroy', () => {
  //     writeSpy.and.callFake(fakeWriteFail);

  //     personality.gameDataMap.set(mockGuildId, hydratedData);
  //     personality.destroy();

  //     expect(writeSpy).toHaveBeenCalled();
  //     mockLogger.verify((m) => m.error(It.isAny()), Times.once());
  //   });
  // });
});
