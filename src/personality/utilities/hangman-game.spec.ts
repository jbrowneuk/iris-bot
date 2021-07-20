import { GameState } from '../interfaces/hangman-game';
import { isGameActive } from './hangman-game';

describe('Hangman Game Utilities', () => {
  describe('game active check', () => {
    it('should return false if the game state is falsy', () => {
      const falsyStates: any[] = [undefined, null];
      falsyStates.forEach((v) => {
        const gameActive = isGameActive(v);
        expect(gameActive).toBe(false);
      });
    });

    it('should return true if lives remaining and words don’t match', () => {
      const state: GameState = {
        timeStarted: 1,
        currentWord: 'any',
        currentDisplay: '-n-',
        livesRemaining: 3,
        wrongLetters: ['z'],
        wrongWords: []
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(true);
    });

    it('should return false if lives remaining and words match', () => {
      const word = 'any';
      const state: GameState = {
        timeStarted: 1,
        currentWord: word,
        currentDisplay: word,
        livesRemaining: 3,
        wrongLetters: ['z'],
        wrongWords: []
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });

    it('should return false if no lives remaining and words don’t match', () => {
      const state: GameState = {
        timeStarted: 1,
        currentWord: 'any',
        currentDisplay: '-n-',
        livesRemaining: 0,
        wrongLetters: ['z'],
        wrongWords: []
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });

    // Edge case check
    it('should return false if no lives remaining and words match', () => {
      const word = 'any';
      const state: GameState = {
        timeStarted: 1,
        currentWord: word,
        currentDisplay: word,
        livesRemaining: 0,
        wrongLetters: ['z'],
        wrongWords: []
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });
  });
});
