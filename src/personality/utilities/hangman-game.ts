import { GameData, SerialisableGameData, TimeTextUnit } from '../interfaces/hangman-game';

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
  return input.split(arraySplitToken).filter(str => str.length > 0);
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

export function pluraliseWord(baseWord: string, count: number): string {
  const plural = count === 1 ? '' : 's';
  return baseWord + plural;
}

export function generateTimeText(levels: TimeTextUnit[]): string {
  let returnText = '';
  levels.forEach(({ value, unit }, idx) => {
    if (value === 0) {
      return;
    }

    let separator = '';
    if (returnText.length > 0) {
      separator = idx === levels.length - 1 ? ' and ' : ', ';
    }

    returnText += `${separator}${value} ${pluraliseWord(unit, value)}`;
  });

  return returnText.trim();
}

// Reference: https://stackoverflow.com/a/34270811
export function convertMsecToHumanReadable(msec: number): string {
  const seconds = msec / 1000;
  if (seconds < 1) {
    return 'less than a second';
  }

  const levels = [
    { value: Math.floor(seconds / 31536000), unit: 'year' },
    { value: Math.floor((seconds % 31536000) / 86400), unit: 'day' },
    {
      value: Math.floor(((seconds % 31536000) % 86400) / 3600),
      unit: 'hour'
    },
    {
      value: Math.floor((((seconds % 31536000) % 86400) % 3600) / 60),
      unit: 'minute'
    },
    {
      value: Math.floor((((seconds % 31536000) % 86400) % 3600) % 60),
      unit: 'second'
    }
  ];

  return generateTimeText(levels);
}
