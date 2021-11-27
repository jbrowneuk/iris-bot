import { GameData } from './interfaces/hangman-game';

export const mockActiveGame: GameData = {
  timeStarted: 123456,
  currentWord: 'BAFFLE',
  currentDisplay: 'BA--LE',
  livesRemaining: 7,
  wrongLetters: ['C', 'H'],
  wrongWords: ['BATTLE'],
  totalWins: 10,
  totalLosses: 10,
  currentStreak: 5
};

export const mockCompleteGame: GameData = {
  ...mockActiveGame,
  currentDisplay: mockActiveGame.currentWord
};

export const mockBlankGame: GameData = {
  timeStarted: 0,
  currentWord: '',
  currentDisplay: '',
  livesRemaining: 10,
  wrongLetters: [],
  wrongWords: [],
  totalWins: 0,
  totalLosses: 0,
  currentStreak: 0
};

export const mockGuildId = 'ABC123';

export const mockWord = { word: 'ambivalence' };
