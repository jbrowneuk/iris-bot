import { GameData, SerialisableGameData } from '../interfaces/hangman-game';

export function isGameActive(game: GameData): boolean {
  if (!game) {
    return false;
  }

  return game.livesRemaining > 0 && game.currentDisplay != game.currentWord;
}

export const arraySplitToken = '#';

export function packArray(input: string[]): string {
  return input.join(arraySplitToken);
}

export function unpackArray(input: string): string[] {
  return input.split(arraySplitToken).filter((str) => str.length > 0);
}

export function serialiseGameData(gameData: GameData): SerialisableGameData {
  return {
    ...gameData,
    wrongLetters: packArray(gameData.wrongLetters),
    wrongWords: packArray(gameData.wrongWords)
  };
}

export function deserialiseGameData(rawData: SerialisableGameData): GameData {
  return {
    ...rawData,
    wrongLetters: unpackArray(rawData.wrongLetters),
    wrongWords: unpackArray(rawData.wrongWords)
  };
}
