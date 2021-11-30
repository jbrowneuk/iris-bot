import { guessCommand, prefix, startCommand, statsCommand } from '../constants/hangman-game';
import { GameData } from '../interfaces/hangman-game';
import { embedColor, embedTitle, generateGameEmbed, generateHelpEmbed, generateStatsEmbed } from './hangman-game';

const mockStats = {
  totalWins: 5,
  totalLosses: 2,
  currentStreak: 3
};

const mockGame: GameData = {
  timeStarted: 123456,
  currentWord: 'BAFFLE',
  currentDisplay: 'BA--L-',
  livesRemaining: 7,
  wrongLetters: ['C', 'H'],
  wrongWords: ['BATTLE', 'BOTTLE'],
  ...mockStats
};

const mockNew: GameData = {
  timeStarted: 123456,
  currentWord: 'BAFFLE',
  currentDisplay: '------',
  livesRemaining: 10,
  wrongLetters: [],
  wrongWords: [],
  ...mockStats
};

describe('Hangman Game Status embed', () => {
  it('should have title and colour defined', () => {
    const gameData: GameData = mockGame;
    const embed = generateGameEmbed(gameData);
    expect(embed.title).toBe(embedTitle);
    expect(embed.hexColor).toBe(embedColor);
  });

  it('should display current guessed letters', () => {
    const gameData: GameData = mockGame;
    const embed = generateGameEmbed(gameData);
    expect(embed.description).toContain(mockGame.currentDisplay);
  });

  it('should display remaining lives', () => {
    const gameData: GameData = mockGame;
    const embed = generateGameEmbed(gameData);
    expect(embed.description).toContain(`${mockGame.livesRemaining} chances`);
  });

  it('should display incorrect letters if present', () => {
    const gameData: GameData = mockGame;
    const guessSummary = generateGameEmbed(gameData).fields[0];
    expect(guessSummary.value).toContain(`${mockGame.wrongLetters.join()}`);
  });

  it('should display incorrect words if present', () => {
    const gameData: GameData = mockGame;
    const guessSummary = generateGameEmbed(gameData).fields[0];
    expect(guessSummary.value).toContain(`${mockGame.wrongWords.join()}`);
  });

  it('should display none for incorrect letters if not present', () => {
    const gameData: GameData = mockNew;
    const guessSummary = generateGameEmbed(gameData).fields[0];
    expect(guessSummary.value).toContain('Letters: *none*');
  });

  it('should display none for incorrect words if not present', () => {
    const gameData: GameData = mockNew;
    const guessSummary = generateGameEmbed(gameData).fields[0];
    expect(guessSummary.value).toContain('Words: *none*');
  });
});

describe('Hangman Game Help embed', () => {
  it('should have title and colour defined', () => {
    const embed = generateHelpEmbed();
    expect(embed.title).toBe(embedTitle);
    expect(embed.hexColor).toBe(embedColor);
  });

  it('should contain game summary instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('SUMMARY'));

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(prefix);
  });

  it('should contain game start instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('START'));

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(startCommand);
  });

  it('should contain game play instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('GUESS'));

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(guessCommand);
  });

  it('should contain instructions to view statistics', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('STATS'));

    expect(summaryField).toBeDefined();
    expect(summaryField.value).toContain(statsCommand);
  });
});

describe('Hangman Game Summary embed', () => {
  it('should have title and colour defined', () => {
    const gameData: GameData = mockGame;
    const embed = generateStatsEmbed(gameData);
    expect(embed.title).toBe(embedTitle);
    expect(embed.hexColor).toBe(embedColor);
  });

  it('should display total wins', () => {
    const embed = generateStatsEmbed(mockGame);
    const winField = embed.fields.find(f => f.name.toUpperCase().includes('WINS'));

    expect(winField.value).toBe('' + mockStats.totalWins);
    expect(winField.inline).toBeTrue();
  });

  it('should display total wins', () => {
    const embed = generateStatsEmbed(mockGame);
    const lossField = embed.fields.find(f => f.name.toUpperCase().includes('LOSSES'));

    expect(lossField.value).toBe('' + mockStats.totalLosses);
    expect(lossField.inline).toBeTrue();
  });

  it('should display current win streak', () => {
    const embed = generateStatsEmbed(mockGame);
    const streakField = embed.fields.find(f => f.name.toUpperCase().includes('STREAK'));

    expect(streakField.value).toBe('' + mockStats.currentStreak);
    expect(streakField.inline).toBeTrue();
  });
});
