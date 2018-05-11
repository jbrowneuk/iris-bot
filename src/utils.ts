export function isCharacterInRegex(character: string, regex: RegExp): boolean {
  if (typeof character !== 'string' || character.length !== 1) {
    return false;
  }

  return regex.test(character.charAt(0));
}

export function isPunctuation(character: string): boolean {
  return isCharacterInRegex(character, /[.,:;!?]/);
}

export function getValueStartedWith(
  haystack: string,
  needles: string[]
): string {
  const loweredHaystack = haystack.toLowerCase();
  return needles.find((needle: string) =>
    loweredHaystack.startsWith(needle.toLowerCase())
  );
}
