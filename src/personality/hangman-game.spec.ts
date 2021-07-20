import { Guild, Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';
import { Mock } from 'typemoq';
import { IMock } from 'typemoq/Api/IMock';

import { apiUrl, guessCommand, prefix, startCommand } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';
import { GameState } from './interfaces/hangman-game';

class TestableHangmanGame extends HangmanGame {
  public get gameStateMap(): Map<string, GameState> {
    return this.gameStates;
  }

  public addMockGameState(id: string): void {
    const mockState: GameState = {
      timeStarted: 123456,
      currentWord: 'BAFFLE',
      currentDisplay: 'BA--L-',
      livesRemaining: 7,
      wrongLetters: ['C', 'H'],
      wrongWords: ['BATTLE']
    };
    this.gameStates.set(id, mockState);
  }
}

const mockGuildId = 'ABC123';

describe('Hangman game', () => {
  let fetchSpy: jasmine.Spy;
  let personality: TestableHangmanGame;
  let mockGuild: IMock<Guild>;

  beforeEach(() => {
    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup((m) => m.id).returns(() => mockGuildId);

    personality = new TestableHangmanGame(null);
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
    const mockWord = { word: 'ambivalence' };
    let mockMessage: IMock<Message>;

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

        const afterState = personality.gameStateMap.get(mockGuildId);
        expect(afterState.currentWord).toBe(mockWord.word.toUpperCase());

        done();
      });
    });

    it('should add game state for guild on start', (done) => {
      expect(personality.gameStateMap.has(mockGuildId)).toBeFalse();

      personality.onMessage(mockMessage.object).then(() => {
        expect(personality.gameStateMap.has(mockGuildId)).toBeTrue();
        done();
      });
    });

    it('should not start a game if one is in progress', (done) => {
      personality.addMockGameState(mockGuildId);
      const beforeState = personality.gameStateMap.get(mockGuildId);

      personality.onMessage(mockMessage.object).then(() => {
        expect(fetchSpy).not.toHaveBeenCalledWith(apiUrl);
        const afterState = personality.gameStateMap.get(mockGuildId);
        expect(beforeState).toEqual(afterState);
        done();
      });
    });
  });

  describe('Guessing behaviour - single letters', () => {
    let mockMessage: IMock<Message>;

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
        const afterState = personality.gameStateMap.get(mockGuildId);
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
        const afterState = personality.gameStateMap.get(mockGuildId);
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
        const afterState = personality.gameStateMap.get(mockGuildId);
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
        const afterState = personality.gameStateMap.get(mockGuildId);
        expect(afterState.wrongLetters).toContain(guessLetterUC);
        done();
      });
    });

    it('should remove life on incorrect letter', (done) => {
      const guessLetter = 'z';
      const beforeState = personality.gameStateMap.get(mockGuildId);
      const beforeLives = beforeState.livesRemaining;

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.gameStateMap.get(mockGuildId);
        expect(afterState.livesRemaining).toBe(beforeLives - 1);
        done();
      });
    });

    it('should not duplicate an incorrect letter', (done) => {
      const beforeState = personality.gameStateMap.get(mockGuildId);
      const beforeLetterCount = beforeState.wrongLetters.length;
      const guessLetter = beforeState.wrongLetters[0];

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.gameStateMap.get(mockGuildId);
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

        const afterState = personality.gameStateMap.get(mockGuildId);
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

        const afterState = personality.gameStateMap.get(mockGuildId);
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
        const afterState = personality.gameStateMap.get(mockGuildId);
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
        const afterState = personality.gameStateMap.get(mockGuildId);
        expect(afterState.wrongWords).toContain(guessWordUC);
        done();
      });
    });

    it('should not duplicate an incorrect word', (done) => {
      const beforeState = personality.gameStateMap.get(mockGuildId);
      const beforeWordsCount = beforeState.wrongWords.length;
      const guessWord = beforeState.wrongWords[0];

      mockMessage
        .setup((s) => s.content)
        .returns(() => `${prefix} ${guessCommand} ${guessWord}`);

      personality.onMessage(mockMessage.object).then(() => {
        const afterState = personality.gameStateMap.get(mockGuildId);
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

        const afterState = personality.gameStateMap.get(mockGuildId);
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

        const afterState = personality.gameStateMap.get(mockGuildId);
        expect(afterState.wrongWords).not.toContain(guessWord);
        done();
      });
    });
  });
});
