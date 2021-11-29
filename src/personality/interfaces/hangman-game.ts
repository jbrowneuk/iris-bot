interface GameDataBase {
  timeStarted: number;
  currentWord: string;
  currentDisplay: string;
  livesRemaining: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
}

/**
 * Encapsulates game data for the Hangman game
 */
export interface GameData extends GameDataBase {
  wrongLetters: string[];
  wrongWords: string[];
}

export interface SerialisableGameData extends GameDataBase {
  wrongLetters: string;
  wrongWords: string;
}

/**
 * Encapsulates word data for the Hangman game
 */
export interface WordData {
  word: string;
}
