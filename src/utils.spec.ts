import {
  getValueStartedWith,
  isPunctuation,
  randomFloat,
  randomInteger
} from './utils';

describe('utilities - test whether character is in a regex', () => {
  it('should match specific punctuation', () => {
    const matchingPunctuation = '.,:;!?';

    for (let index = 0; index < matchingPunctuation.length; index += 1) {
      const result = isPunctuation(matchingPunctuation.charAt(index));
      expect(result).toBe(true);
    }
  });

  it('should not match non-punctuation', () => {
    const randomChars = Date.now().toString().substring(2);

    for (let index = 0; index < randomChars.length; index += 1) {
      const result = isPunctuation(randomChars.charAt(index));
      expect(result).toBe(false);
    }
  });
});

describe('utilities - test whether a string starts with a value in a set', () => {
  it('should return the match if the string begins with a value from a set', () => {
    const matches = ['hello', 'start', 'begin'];
    const strings = ['hello world', 'start here', 'begin with this'];

    for (let index = 0; index < matches.length; index += 1) {
      const expectedMatch = matches[index];
      const searchString = strings[index];

      const actual = getValueStartedWith(searchString, matches);

      expect(actual).toBe(expectedMatch);
    }
  });

  it('should not return the match if the string contains a value from a set', () => {
    const matches = ['hello', 'start', 'begin'];
    const strings = ['hello world', 'start here', 'begin with this'];
    const prefix = 'Loads of words';

    for (let index = 0; index < matches.length; index += 1) {
      const searchString = `${prefix} ${strings[index]}`;

      const actual = getValueStartedWith(searchString, matches);

      expect(actual).toBeUndefined();
    }
  });
});

describe('utilities - random number generation', () => {
  beforeEach(() => {
    // Mock the randomiser behaviour for consistent results
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  describe('random float', () => {
    it('should return a random float between min and max', () => {
      const minValue = 1;
      const maxValue = 2;

      const actualValue = randomFloat(minValue, maxValue);

      expect(actualValue).toBeCloseTo(1.5, Number.EPSILON);
    });

    it('should return a random float between zero and param', () => {
      const maxValue = 7;

      const actualValue = randomFloat(maxValue);

      expect(actualValue).toBeCloseTo(3.5, Number.EPSILON);
    });
  });

  describe('random integer', () => {
    it('should return a floored random integer between min and max', () => {
      const minValue = 1;
      const maxValue = 2;

      const actualValue = randomInteger(minValue, maxValue);

      expect(actualValue).toBe(1);
    });

    it('should return a floored random integer between zero and param', () => {
      const maxValue = 7;

      const actualValue = randomInteger(maxValue);

      expect(actualValue).toBeCloseTo(3, Number.EPSILON);
    });
  });
});
