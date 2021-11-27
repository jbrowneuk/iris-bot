import { GameData } from '../interfaces/hangman-game';
import { isGameActive } from './hangman-game';

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
});
