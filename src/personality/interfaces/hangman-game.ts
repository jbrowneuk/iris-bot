/**
 * Encapsulates the game statistics for the Hangman game
 */
export interface GameStatistics {
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
}

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
 * Encapsulates game data for the Hangman game
 */
export interface GameData {
  state: GameState;
  statistics: GameStatistics;
}

/**
 * Encapsulates word data for the Hangman game
 */
export interface WordData {
  word: string;
}
