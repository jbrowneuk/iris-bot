import { Guild, Message, MessageEmbed } from 'discord.js';
import * as nodeFetch from 'node-fetch';
import { IMock, Mock } from 'typemoq';

import { DependencyContainer } from '../interfaces/dependency-container';
import { apiUrl, guessCommand, prefix, startCommand, statsCommand } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';
import { GameData, GameState, GameStatistics } from './interfaces/hangman-game';

class TestableHangmanGame extends HangmanGame {
  public constructor() {
    const mockDeps = Mock.ofType<DependencyContainer>();
    mockDeps.setup((m) => m.logger).returns(() => console);

    super(mockDeps.object);

    // Lazy init
    if (!this.gameData) {
      this.gameData = new Map<string, GameData>();
    }
  }

  public get gameDataMap(): Map<string, GameData> {
    return this.gameData;
  }

  public getStateForGuild(id: string): GameState {
    return this.gameData.get(id).state;
  }

  public getStatsForGuild(id: string): GameStatistics {
    return this.gameData.get(id).statistics;
  }

  public addMockGameState(id: string): GameData {
    const state: GameState = {
      timeStarted: 123456,
      currentWord: 'BAFFLE',
      currentDisplay: 'BA--L-',
      livesRemaining: 7,
      wrongLetters: ['C', 'H'],
      wrongWords: ['BATTLE']
    };

    const statistics: GameStatistics = {
      totalWins: 10,
      totalLosses: 10,
      currentStreak: 5
    };

    const addition = { state, statistics };
    this.gameData.set(id, addition);
    return addition;
  }

  public addBlankGameState(id: string): GameData {
    const state: GameState = {
      timeStarted: 0,
      currentWord: '',
      currentDisplay: '',
      livesRemaining: 10,
      wrongLetters: [],
      wrongWords: []
    };

    const statistics: GameStatistics = {
      totalWins: 0,
      totalLosses: 0,
      currentStreak: 0
    };

    const addition = { state, statistics };
    this.gameData.set(id, addition);
    return addition;
  }

  public setGameCompleteByWin(id: string): void {
    const game = this.gameData.get(id).state;
    game.currentDisplay = game.currentWord;
  }
}

const mockGuildId = 'ABC123';

describe('Hangman game', () => {
  const mockWord = { word: 'ambivalence' };

  let fetchSpy: jasmine.Spy;
  let personality: TestableHangmanGame;
  let mockGuild: IMock<Guild>;
  let mockMessage: IMock<Message>;

  beforeEach(() => {
    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup((m) => m.id).returns(() => mockGuildId);

    personality = new TestableHangmanGame();
  });

  it('should create', () => {
    expect(personality).toBeTruthy();
  });

  describe('help functionality', () => {
    it('should respond with help message', (done) => {
      personality.onHelp().then((response) => {
        expect(response).toBeTruthy();
        done();
      });
    });
  });

  describe('Game start behaviour', () => {
    beforeEach(() => {
      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockWord)
      };

      fetchSpy = spyOn(nodeFetch, 'default');
      fetchSpy.and.returnValue(Promise.resolve(mockFetchResponse));

      mockMessage = Mock.ofType<Message>();
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${startCommand}`);
      mockMessage.setup((s) => s.guild).returns(() => mockGuild.object);
    });

    it('should fetch word on start command', (done) => {
      personality.onMessage(mockMessage.object).then(() => {
        expect(fetchSpy).toHaveBeenCalledWith(apiUrl);

        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.currentWord).toBe(mockWord.word.toUpperCase());

        done();
      });
    });

    it('should add game data for guild on start if not existing', (done) => {
      expect(personality.gameDataMap.has(mockGuildId)).toBeFalse();

      personality.onMessage(mockMessage.object).then(() => {
        expect(personality.gameDataMap.has(mockGuildId)).toBeTrue();
        done();
      });
    });

    it('should update game data for guild on start', (done) => {
      personality.addMockGameState(mockGuildId);
      personality.setGameCompleteByWin(mockGuildId);
      const oldWord = personality.getStateForGuild(mockGuildId).currentDisplay;
      expect(oldWord).not.toContain('-');

      personality.onMessage(mockMessage.object).then(() => {
        const newWord = personality.getStateForGuild(mockGuildId)
          .currentDisplay;

        expect(newWord).not.toBe(oldWord);
        done();
      });
    });

    it('should not start a game if one is in progress', (done) => {
      personality.addMockGameState(mockGuildId);
      const beforeState = personality.getStateForGuild(mockGuildId);

      personality.onMessage(mockMessage.object).then(() => {
        expect(fetchSpy).not.toHaveBeenCalledWith(apiUrl);
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(beforeState).toEqual(afterState);
        done();
      });
    });
  });

  describe('Guessing behaviour - single letters', () => {
    beforeEach(() => {
      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((s) => s.guild).returns(() => mockGuild.object);

      personality.addMockGameState(mockGuildId);
    });

    it('should add correct letter to display variable', (done) => {
      const guessLetter = 'f';
      const guessLetterUC = guessLetter.toUpperCase();

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.currentDisplay).toContain(guessLetterUC);
        done();
      });
    });

    it('should not add correct letter to wrong letters array', (done) => {
      const guessLetter = 'f';
      const guessLetterUC = guessLetter.toUpperCase();

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongLetters).not.toContain(guessLetterUC);
        done();
      });
    });

    it('should not add incorrect letter to display variable', (done) => {
      const guessLetter = 'z';
      const guessLetterUC = guessLetter.toUpperCase();

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.currentDisplay).not.toContain(guessLetterUC);
        done();
      });
    });

    it('should add incorrect letter to incorrect letters array', (done) => {
      const guessLetter = 'z';
      const guessLetterUC = guessLetter.toUpperCase();

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongLetters).toContain(guessLetterUC);
        done();
      });
    });

    it('should remove life on incorrect letter', (done) => {
      const guessLetter = 'z';
      const beforeState = personality.getStateForGuild(mockGuildId);
      const beforeLives = beforeState.livesRemaining;

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.livesRemaining).toBe(beforeLives - 1);
        done();
      });
    });

    it('should not duplicate an incorrect letter', (done) => {
      const beforeState = personality.getStateForGuild(mockGuildId);
      const beforeLetterCount = beforeState.wrongLetters.length;
      const guessLetter = beforeState.wrongLetters[0];

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongLetters.length).toBe(beforeLetterCount);
        done();
      });
    });

    it('should not accept numeric character', (done) => {
      const guessChar = '4';

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessChar}`);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toContain('not a letter');

        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongLetters).not.toContain(guessChar);
        done();
      });
    });

    it('should not accept symbol character', (done) => {
      const guessChar = '#';

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessChar}`);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toContain('not a letter');

        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongLetters).not.toContain(guessChar);
        done();
      });
    });
  });

  describe('Guessing behaviour - words', () => {
    let mockMessage: IMock<Message>;

    beforeEach(() => {
      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((s) => s.guild).returns(() => mockGuild.object);

      personality.addMockGameState(mockGuildId);
    });

    it('should complete display variable with correct guess', (done) => {
      const guessWord = 'baffle';
      const guessWordUC = guessWord.toUpperCase();

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessWord}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.currentDisplay).toBe(guessWordUC);
        done();
      });
    });

    it('should add incorrect guess to wrong words array', (done) => {
      const guessWord = 'bottle';
      const guessWordUC = guessWord.toUpperCase();

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessWord}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongWords).toContain(guessWordUC);
        done();
      });
    });

    it('should not duplicate an incorrect word', (done) => {
      const beforeState = personality.getStateForGuild(mockGuildId);
      const beforeWordsCount = beforeState.wrongWords.length;
      const guessWord = beforeState.wrongWords[0];

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessWord}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongWords.length).toBe(beforeWordsCount);
        done();
      });
    });

    it('should not accept word with symbol character', (done) => {
      const guessWord = 'b#ffle';

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessWord}`);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toContain('not a word');

        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongWords).not.toContain(guessWord);
        done();
      });
    });

    it('should not accept word with numeric character', (done) => {
      const guessWord = 'b0ffle';

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessWord}`);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toContain('not a word');

        const afterState = personality.getStateForGuild(mockGuildId);
        expect(afterState.wrongWords).not.toContain(guessWord);
        done();
      });
    });
  });

  describe('Statistic summary', () => {
    const word = 'ABCDE';
    let startData: GameData;

    beforeEach(() => {
      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((s) => s.guild).returns(() => mockGuild.object);

      personality.addBlankGameState(mockGuildId);
      startData = personality.gameDataMap.get(mockGuildId);
      startData.state.currentWord = word;
      startData.state.currentDisplay = word.replace(word[2], '-');
    });

    it('should return embed showing statistics', (done) => {
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${statsCommand}`);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeInstanceOf(MessageEmbed);
        done();
      });
    });

    it('should add to total wins and win streak if won by word guess', (done) => {
      const startWins = startData.statistics.totalWins;
      const startStreak = startData.statistics.currentStreak;
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${word}`);

      personality.onMessage(mockMessage.object).then(() => {
        const currentData = personality.gameDataMap.get(mockGuildId);
        expect(currentData.statistics.totalWins).toBe(startWins + 1);
        expect(currentData.statistics.currentStreak).toBe(startStreak + 1);
        done();
      });
    });

    it('should add to total wins and win streak if won by letter guess', (done) => {
      const startWins = startData.statistics.totalWins;
      const startStreak = startData.statistics.currentStreak;
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${word[2]}`);

      personality.onMessage(mockMessage.object).then(() => {
        const currentData = personality.gameDataMap.get(mockGuildId);
        expect(currentData.statistics.totalWins).toBe(startWins + 1);
        expect(currentData.statistics.currentStreak).toBe(startStreak + 1);
        done();
      });
    });

    it('should add to total losses and clear streak if lost by word guess', (done) => {
      const startLosses = startData.statistics.totalLosses;
      startData.state.livesRemaining = 1;
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${word.replace('A', 'Z')}`);

      personality.onMessage(mockMessage.object).then(() => {
        const currentData = personality.gameDataMap.get(mockGuildId);
        expect(currentData.statistics.totalLosses).toBe(startLosses + 1);
        expect(currentData.statistics.currentStreak).toBe(0);
        done();
      });
    });

    it('should add to total losses and clear streak if lost by letter guess', (done) => {
      const startLosses = startData.statistics.totalLosses;
      startData.state.livesRemaining = 1;
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} z`);

      personality.onMessage(mockMessage.object).then(() => {
        const currentData = personality.gameDataMap.get(mockGuildId);
        expect(currentData.statistics.totalLosses).toBe(startLosses + 1);
        expect(currentData.statistics.currentStreak).toBe(0);
        done();
      });
    });

    it('should keep total losses on incorrect word guess with lives remaining', (done) => {
      const streak = 5;
      const startLosses = startData.statistics.totalLosses;
      startData.state.livesRemaining = 5;
      startData.statistics.currentStreak = streak;
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${word.replace('A', 'Z')}`);

      personality.onMessage(mockMessage.object).then(() => {
        const currentData = personality.gameDataMap.get(mockGuildId);
        expect(currentData.statistics.totalLosses).toBe(startLosses);
        expect(currentData.statistics.currentStreak).toBe(streak);
        done();
      });
    });
  });

  describe('Multiple guild feature', () => {
    const altGuildId = 'myaltguild';
    let altGuildStartState: GameState;

    beforeEach(() => {
      const mockFetchResponse = {
        ok: true,
        json: () => Promise.resolve(mockWord)
      };

      fetchSpy = spyOn(nodeFetch, 'default');
      fetchSpy.and.returnValue(Promise.resolve(mockFetchResponse));

      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((s) => s.guild).returns(() => mockGuild.object);

      personality.addMockGameState(altGuildId);
      altGuildStartState = { ...personality.getStateForGuild(altGuildId) };
    });

    it('should not affect existing game if new one started in alternate guild', (done) => {
      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${startCommand}`);

      expect(personality.gameDataMap.get(mockGuildId)).toBeFalsy();

      personality.onMessage(mockMessage.object).then(() => {
        // Other guild not touched
        const altGuildState = personality.getStateForGuild(altGuildId);
        expect(altGuildState).toEqual(altGuildStartState);

        // Current guild data added
        expect(personality.gameDataMap.get(mockGuildId)).toBeTruthy();
        done();
      });
    });

    it('should not affect existing game if guess happens in alternate guild', (done) => {
      const initialData = personality.addBlankGameState(mockGuildId);
      initialData.state.currentWord = 'WORD';
      initialData.state.currentDisplay = '----';
      initialData.state.livesRemaining = 10;
      const guessLetter = initialData.state.currentWord[0];

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        // Other guild not touched
        const altGuildState = personality.getStateForGuild(altGuildId);
        expect(altGuildState).toEqual(altGuildStartState);

        // Current guild data added
        const gameState = personality.getStateForGuild(mockGuildId);
        expect(gameState.currentDisplay).toContain(guessLetter);
        done();
      });
    });
  });
});
