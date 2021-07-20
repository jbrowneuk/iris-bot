import { guessCommand, prefix, startCommand } from '../constants/hangman-game';
import { GameState } from '../interfaces/hangman-game';
import { generateGameEmbed, generateHelpEmbed } from './hangman-game';

describe('Hangman Game Status embed', () => {
  const mockGame: GameState = {
    timeStarted: 123456,
    currentWord: 'BAFFLE',
    currentDisplay: 'BA--L-',
    livesRemaining: 7,
    wrongLetters: ['C', 'H'],
    wrongWords: ['BATTLE', 'BOTTLE']
  };

  const mockNew: GameState = {
    timeStarted: 123456,
    currentWord: 'BAFFLE',
    currentDisplay: '------',
    livesRemaining: 10,
    wrongLetters: [],
    wrongWords: []
  };

  it('should display current guessed letters', () => {
    const embed = generateGameEmbed(mockGame);
    expect(embed.description).toContain(mockGame.currentDisplay);
  });

  it('should display remaining lives', () => {
    const embed = generateGameEmbed(mockGame);
    expect(embed.description).toContain(`${mockGame.livesRemaining} chances`);
  });

  it('should display incorrect letters if present', () => {
    const guessSummary = generateGameEmbed(mockGame).fields[0];
    expect(guessSummary.value).toContain(`${mockGame.wrongLetters.join()}`);
  });

  it('should display incorrect words if present', () => {
    const guessSummary = generateGameEmbed(mockGame).fields[0];
    expect(guessSummary.value).toContain(`${mockGame.wrongWords.join()}`);
  });

  it('should display none for incorrect letters if not present', () => {
    const guessSummary = generateGameEmbed(mockNew).fields[0];
    expect(guessSummary.value).toContain('Letters: *none*');
  });

  it('should display none for incorrect words if not present', () => {
    const guessSummary = generateGameEmbed(mockNew).fields[0];
    expect(guessSummary.value).toContain('Words: *none*');
  });
});

describe('Hangman Game Help embed', () => {
  it('should contain game summary instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find((f) =>
      f.name.toUpperCase().includes('SUMMARY')
    );

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(prefix);
  });

  it('should contain game start instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find((f) =>
      f.name.toUpperCase().includes('START')
    );

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(startCommand);
  });

  it('should contain game play instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find((f) =>
      f.name.toUpperCase().includes('GUESS')
    );

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(guessCommand);
  });
});
