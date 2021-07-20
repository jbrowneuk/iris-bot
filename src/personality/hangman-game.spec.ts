import { HangmanGame } from './hangman-game';

describe('Hangman game', () => {
  let personality: HangmanGame;

  beforeEach(() => {
    personality = new HangmanGame();
  });

  it('should create', () => {
    expect(personality).toBeTruthy();
  });
});
