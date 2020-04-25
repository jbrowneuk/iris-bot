export interface Hangman {
  getLettersToDisplay(): string;
  getIncorrectLetters(): string[];
  getIncorrectWords(): string[];
  getGuessesRemaining(): number;
}
