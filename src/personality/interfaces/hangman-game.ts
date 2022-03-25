interface GameDataBase {
  timeStarted: number;
  currentWord: string;
  currentDisplay: string;
  livesRemaining: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
}

/** Encapsulates game data for the Hangman game */
export interface GameData extends GameDataBase {
  wrongLetters: string[];
  wrongWords: string[];
}

export interface SerialisableGameData extends GameDataBase {
  wrongLetters: string;
  wrongWords: string;
}

/** Encapsulates word data for the Hangman game */
export interface WordData {
  word: string;
}

/** Encapsulates a word length summary from the dictionary statistics response */
export interface WordLength {
  'word-length': number;
  count: number;
}

/** Encapsulates the dictionary statistics response */
export interface DictionaryInfo {
  totalWords: number;
  wordLengths: WordLength[];
}

export interface TimeTextUnit {
  value: number;
  unit: string;
}
