import { GameData, SerialisableGameData } from '../interfaces/hangman-game';
import {
  arraySplitToken,
  deserialiseGameData,
  isGameActive,
  packArray,
  serialiseGameData,
  unpackArray
} from './hangman-game';

describe('Hangman Game Utilities', () => {
  describe('game active check', () => {
    it('should return false if the game state is falsy', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const falsyStates: any[] = [undefined, null];
      falsyStates.forEach((v) => {
        const gameActive = isGameActive(v);
        expect(gameActive).toBe(false);
      });
    });

    it('should return true if lives remaining and words don’t match', () => {
      const state = {
        timeStarted: 1,
        currentWord: 'any',
        currentDisplay: '-n-',
        livesRemaining: 3,
        wrongLetters: ['z'],
        wrongWords: []
      } as GameData;

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(true);
    });

    it('should return false if lives remaining and words match', () => {
      const word = 'any';
      const state = {
        timeStarted: 1,
        currentWord: word,
        currentDisplay: word,
        livesRemaining: 3,
        wrongLetters: ['z'],
        wrongWords: []
      } as GameData;

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });

    it('should return false if no lives remaining and words don’t match', () => {
      const state = {
        timeStarted: 1,
        currentWord: 'any',
        currentDisplay: '-n-',
        livesRemaining: 0,
        wrongLetters: ['z'],
        wrongWords: []
      } as GameData;

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });

    // Edge case check
    it('should return false if no lives remaining and words match', () => {
      const word = 'any';
      const state = {
        timeStarted: 1,
        currentWord: word,
        currentDisplay: word,
        livesRemaining: 0,
        wrongLetters: ['z'],
        wrongWords: []
      } as GameData;

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });
  });

  describe('Array packing', () => {
    it('should concat an array of strings into a single string separated by symbol', () => {
      const input = ['a', 'b', 'c'];
      const expectedOutput = input.join(arraySplitToken);

      const result = packArray(input);

      expect(result).toBe(expectedOutput);
    });
  });

  describe('Array unpacking', () => {
    it('should split a single string separated by symbol into an array of strings', () => {
      const expectedOutput = ['a', 'b', 'c'];
      const input = expectedOutput.join(arraySplitToken);

      const result = unpackArray(input);

      expect(result).toEqual(expectedOutput);
    });
  });

  describe('game state de/serialisation preparation', () => {
    const commonData = {
      timeStarted: 10247680,
      currentWord: 'current',
      currentDisplay: '-------',
      livesRemaining: 8,
      totalWins: 8,
      totalLosses: 8,
      currentStreak: 2
    };

    const gameData: GameData = {
      ...commonData,
      wrongLetters: ['a', 'b'],
      wrongWords: ['asinine']
    };

    const serialisationReadyGameData: SerialisableGameData = {
      ...commonData,
      wrongLetters: gameData.wrongLetters.join(arraySplitToken),
      wrongWords: gameData.wrongWords.join(arraySplitToken)
    };

    it('should convert from game state into a serialisable format', () => {
      const actual = serialiseGameData(gameData);
      expect(actual).toEqual(serialisationReadyGameData);
    });

    it('should convert from a serialisable format into game state', () => {
      const actual = deserialiseGameData(serialisationReadyGameData);
      expect(actual).toEqual(gameData);
    });

    it('should handle blank arrays', () => {
      const gameDataClone = { ...gameData };
      gameDataClone.wrongLetters = [];
      gameDataClone.wrongWords = [];

      const converted = serialiseGameData(gameDataClone);
      expect(converted.wrongLetters).toBe('');
      expect(converted.wrongWords).toBe('');

      const reconverted = deserialiseGameData(converted);
      expect(reconverted.wrongLetters).toEqual([]);
      expect(reconverted.wrongWords).toEqual([]);
    });
  });
});
