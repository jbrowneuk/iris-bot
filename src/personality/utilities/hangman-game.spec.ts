import { GameData, SerialisableGameData } from '../interfaces/hangman-game';
import {
  arraySplitToken,
  convertMsecToHumanReadable,
  deserialiseGameData,
  generateTimeText,
  isGameActive,
  packArray,
  pluraliseWord,
  serialiseGameData,
  unpackArray
} from './hangman-game';

describe('Hangman Game Utilities', () => {
  describe('game active check', () => {
    it('should return false if the game state is falsy', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const falsyStates: any[] = [undefined, null];
      falsyStates.forEach(v => {
        const gameActive = isGameActive(v);
        expect(gameActive).toBe(false);
      });
    });

    it('should return true if lives remaining and words don’t match', () => {
      const state: GameData = {
        timeStarted: 1,
        currentWord: 'any',
        currentDisplay: '-n-',
        livesRemaining: 3,
        wrongLetters: ['z'],
        wrongWords: [],
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(true);
    });

    it('should return false if lives remaining and words match', () => {
      const word = 'any';
      const state: GameData = {
        timeStarted: 1,
        currentWord: word,
        currentDisplay: word,
        livesRemaining: 3,
        wrongLetters: ['z'],
        wrongWords: [],
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });

    it('should return false if no lives remaining and words don’t match', () => {
      const state: GameData = {
        timeStarted: 1,
        currentWord: 'any',
        currentDisplay: '-n-',
        livesRemaining: 0,
        wrongLetters: ['z'],
        wrongWords: [],
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });

    // Edge case check
    it('should return false if no lives remaining and words match', () => {
      const word = 'any';
      const state: GameData = {
        timeStarted: 1,
        currentWord: word,
        currentDisplay: word,
        livesRemaining: 0,
        wrongLetters: ['z'],
        wrongWords: [],
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0
      };

      const gameActive = isGameActive(state);
      expect(gameActive).toBe(false);
    });
  });

  describe('Array packing', () => {
    it('should concat an array of strings into a single string separated by symbol', () => {
      const input = ['a', 'b', 'c'];
      const expectedOutput = input.join(arraySplitToken);

      const result = packArray(input);

      expect(result).toBe(expectedOutput);
    });
  });

  describe('Array unpacking', () => {
    it('should split a single string separated by symbol into an array of strings', () => {
      const expectedOutput = ['a', 'b', 'c'];
      const input = expectedOutput.join(arraySplitToken);

      const result = unpackArray(input);

      expect(result).toEqual(expectedOutput);
    });
  });

  describe('game state de/serialisation preparation', () => {
    const commonData = {
      timeStarted: 10247680,
      currentWord: 'current',
      currentDisplay: '-------',
      livesRemaining: 8,
      totalWins: 8,
      totalLosses: 8,
      currentStreak: 2
    };

    const gameData: GameData = {
      ...commonData,
      wrongLetters: ['a', 'b'],
      wrongWords: ['asinine']
    };

    const serialisationReadyGameData: SerialisableGameData = {
      ...commonData,
      wrongLetters: gameData.wrongLetters.join(arraySplitToken),
      wrongWords: gameData.wrongWords.join(arraySplitToken)
    };

    it('should convert from game state into a serialisable format', () => {
      const actual = serialiseGameData(gameData);
      expect(actual).toEqual(serialisationReadyGameData);
    });

    it('should convert from a serialisable format into game state', () => {
      const actual = deserialiseGameData(serialisationReadyGameData);
      expect(actual).toEqual(gameData);
    });

    it('should handle blank arrays', () => {
      const gameDataClone = { ...gameData };
      gameDataClone.wrongLetters = [];
      gameDataClone.wrongWords = [];

      const converted = serialiseGameData(gameDataClone);
      expect(converted.wrongLetters).toBe('');
      expect(converted.wrongWords).toBe('');

      const reconverted = deserialiseGameData(converted);
      expect(reconverted.wrongLetters).toEqual([]);
      expect(reconverted.wrongWords).toEqual([]);
    });
  });
});

describe('pluraliseWord', () => {
  it('should pluralise a zero count', () => {
    const word = 'word';
    const result = pluraliseWord(word, 0);
    expect(result).toBe(word + 's');
  });

  it('should not pluralise a single count', () => {
    const word = 'word';
    const result = pluraliseWord(word, 1);
    expect(result).toBe(word);
  });

  it('should pluralise a positive number greater than 1', () => {
    const word = 'word';
    const result = pluraliseWord(word, 5);
    expect(result).toBe(word + 's');
  });
});

describe('Calculating time values', () => {
  const secondLength = 1000;
  const minuteLength = secondLength * 60;
  const hourLength = minuteLength * 60;
  const dayLength = hourLength * 24;
  const yearLength = dayLength * 365;

  const calcValueTests = [
    { unit: 'year', multiplier: 2, baseLength: yearLength },
    { unit: 'day', multiplier: 4, baseLength: dayLength },
    { unit: 'hour', multiplier: 12, baseLength: hourLength },
    { unit: 'minute', multiplier: 5, baseLength: minuteLength },
    { unit: 'second', multiplier: 30, baseLength: secondLength }
  ];

  calcValueTests.forEach(({ unit, multiplier, baseLength }) => {
    it(`should calculate correct ${unit} for a ${multiplier} ${unit} timespan`, () => {
      const timespan = baseLength * multiplier;

      const textResult = convertMsecToHumanReadable(timespan);
      expect(textResult).toContain(`${multiplier} ${unit}`);
    });
  });

  it('should return the string ‘less than a second’ for millisecond values less than one second', () => {
    const timespan = 100;

    const response = convertMsecToHumanReadable(timespan);

    expect(response).toBe('less than a second');
  });

  it('should be able to calculate all values for a year + day + min + second value', () => {
    const timespan = yearLength + dayLength + hourLength + minuteLength + secondLength;
    const textResult = convertMsecToHumanReadable(timespan);
    ['year', 'day', 'hour', 'minute', 'second'].forEach(unit => {
      expect(textResult).toContain(`1 ${unit}`);
    });
  });
});

describe('Presenting human-readable time values', () => {
  ['year', 'day', 'hour', 'minute', 'second'].forEach(unit => {
    it(`should give correct unit for 1 ${unit}`, () => {
      const result = generateTimeText([{ value: 1, unit }]);
      expect(result).toBe(`1 ${unit}`);
    });

    it(`should correctly pluralise when unit is ${unit} and value is multiple`, () => {
      const result = generateTimeText([{ value: 2, unit }]);
      expect(result).toBe(`2 ${unit}s`);
    });
  });

  it('should concatenate multiple units together with commas and the word ‘and’', () => {
    const units = [
      { value: 2, unit: 'year' },
      { value: 4, unit: 'hour' },
      { value: 1, unit: 'second' }
    ];
    const result = generateTimeText(units);
    expect(result).toBe('2 years, 4 hours and 1 second');
  });
});
