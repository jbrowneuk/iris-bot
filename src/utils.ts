/**
 * Convenience method: tests whether a character is found in a regular expression
 *
 * @param character The character to match
 * @param regex the RegExp to use for matching
 */
export function isCharacterInRegex(character: string, regex: RegExp): boolean {
  if (typeof character !== 'string' || character.length !== 1) {
    return false;
  }

  return regex.test(character.charAt(0));
}

/**
 * Convenience method: tests whether a character is punctuation
 *
 * @param character The character to match
 */
export function isPunctuation(character: string): boolean {
  return isCharacterInRegex(character, /[.,:;!?]/);
}

/**
 * Returns the value of the first element in the array if the supplied string
 * begins with this value, or undefined otherwise.
 *
 * @param haystack the string being searched
 * @param needles the values to test with
 */
export function getValueStartedWith(
  haystack: string,
  needles: string[]
): string {
  const loweredHaystack = haystack.toLowerCase();
  return needles.find((needle: string) =>
    loweredHaystack.startsWith(needle.toLowerCase())
  );
}

/**
 * Central location for random number generation
 *
 * @param min if max is specifed, acts as the lower bound of the random number
 *            range. If not, acts as the upper bound.
 * @param max (optional) upper bound of the random number range
 */
export function randomNumber(min: number, max?: number): number {
  let minimum = min;
  let maximum = max;
  if (typeof max === 'undefined') {
    minimum = 0;
    maximum = min;
  }

  return Math.floor(Math.random() * (maximum - minimum)) + minimum;
}
