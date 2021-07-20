/**
 * Encapsulates the basic game state for the Hangman game
 */
export interface GameState {
  timeStarted: number;
  currentWord: string;
  currentDisplay: string;
  livesRemaining: number;
  wrongLetters: string[];
  wrongWords: string[];
}

/**
 * Encapsulates word data for the Hangman game
 */
export interface WordData {
  word: string;
}
