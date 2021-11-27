import { GameData } from '../interfaces/hangman-game';

export function isGameActive(game: GameData): boolean {
  if (!game) {
    return false;
  }

  return game.livesRemaining > 0 && game.currentDisplay != game.currentWord;
}
