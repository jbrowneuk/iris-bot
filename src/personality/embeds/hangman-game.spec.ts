import { MessageButton, MessageEmbed } from 'discord.js';

import { dictionaryCommand, graphicsExtension, graphicsRootUrl, guessCommand, prefix, startCommand, statsCommand } from '../constants/hangman-game';
import { DictionaryInfo, GameData } from '../interfaces/hangman-game';
import {
  embedColorError,
  embedColorNormal,
  embedTitle,
  generateDictionaryEmbed,
  generateGameEmbed,
  generateGameEndMesage,
  generateHelpEmbed,
  generateStatsEmbed
} from './hangman-game';

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
    expect(embed.hexColor).toBe(embedColorNormal);
  });

  it('should set colour to error if optional defaultColor param is false', () => {
    const gameData: GameData = mockGame;
    const embed = generateGameEmbed(gameData, false);
    expect(embed.hexColor).toBe(embedColorError);
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

  it('should have thumbnail image', () => {
    const gameData: GameData = mockGame;
    const embed = generateGameEmbed(gameData);
    expect(embed.thumbnail?.url).toBe(`${graphicsRootUrl}${mockGame.livesRemaining}${graphicsExtension}`);
  });

  it('should pluralise the word chances correctly', () => {
    const clonedGameData = { ...mockGame };

    clonedGameData.livesRemaining = 0;
    let embed = generateGameEmbed(clonedGameData);
    expect(embed.description).toContain('0 chances');

    clonedGameData.livesRemaining = 1;
    embed = generateGameEmbed(clonedGameData);
    expect(embed.description).toContain('1 chance');

    clonedGameData.livesRemaining = 2;
    embed = generateGameEmbed(clonedGameData);
    expect(embed.description).toContain('2 chances');
  });
});

describe('Hangman Game Help embed', () => {
  it('should have title and colour defined', () => {
    const embed = generateHelpEmbed();
    expect(embed.title).toBe(embedTitle);
    expect(embed.hexColor).toBe(embedColorNormal);
  });

  it('should contain game summary instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('SUMMARY'));

    expect(summaryField).toBeDefined();
    expect(summaryField?.value).toContain(prefix);
  });

  it('should contain game start instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('START'));

    expect(summaryField).toBeDefined();
    expect(summaryField?.value).toContain(startCommand);
  });

  it('should contain game play instructions', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('GUESS'));

    expect(summaryField).toBeDefined();
    expect(summaryField?.value).toContain(guessCommand);
  });

  it('should contain instructions to view statistics', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('STATS'));

    expect(summaryField).toBeDefined();
    expect(summaryField?.value).toContain(statsCommand);
  });

  it('should contain instructions to view dictionary information', () => {
    const helpEmbed = generateHelpEmbed();
    const summaryField = helpEmbed.fields.find(f => f.name.toUpperCase().includes('DICTIONARY'));

    expect(summaryField).toBeDefined();
    expect(summaryField?.value).toContain(dictionaryCommand);
  });
});

describe('Hangman Game Summary embed', () => {
  it('should have title and colour defined', () => {
    const gameData: GameData = mockGame;
    const embed = generateStatsEmbed(gameData);
    expect(embed.title).toBe(embedTitle);
    expect(embed.hexColor).toBe(embedColorNormal);
  });

  it('should display total wins', () => {
    const embed = generateStatsEmbed(mockGame);
    const winField = embed.fields.find(f => f.name.toUpperCase().includes('WINS'));

    expect(winField?.value).toBe('' + mockStats.totalWins);
    expect(winField?.inline).toBe(true);
  });

  it('should display total wins', () => {
    const embed = generateStatsEmbed(mockGame);
    const lossField = embed.fields.find(f => f.name.toUpperCase().includes('LOSSES'));

    expect(lossField?.value).toBe('' + mockStats.totalLosses);
    expect(lossField?.inline).toBe(true);
  });

  it('should display current win streak', () => {
    const embed = generateStatsEmbed(mockGame);
    const streakField = embed.fields.find(f => f.name.toUpperCase().includes('STREAK'));

    expect(streakField?.value).toBe('' + mockStats.currentStreak);
    expect(streakField?.inline).toBe(true);
  });
});

describe('Hangman Game Dictionary Stats embed', () => {
  const fakeDictStats: DictionaryInfo = {
    totalWords: 16,
    wordLengths: [
      { 'word-length': 4, count: 3 },
      { 'word-length': 5, count: 4 },
      { 'word-length': 6, count: 4 },
      { 'word-length': 7, count: 5 }
    ]
  };

  it('should state total number of words in description', () => {
    const embed = generateDictionaryEmbed(fakeDictStats);
    expect(embed.description).toContain(`${fakeDictStats.totalWords} words`);
  });

  it('should state total number of words for each letter length', () => {
    const embed = generateDictionaryEmbed(fakeDictStats);
    fakeDictStats.wordLengths.forEach(lengthData => {
      expect(embed.description).toContain(`${lengthData['word-length']}-letter words: **${lengthData.count}**`);
    });
  });
});

describe('Hangman Game Won/Lost state message', () => {
  const endStateBase = {
    timeStarted: Date.now() - 1024,
    currentWord: 'EGG',
    wrongLetters: ['a'],
    wrongWords: ['air'],
    ...mockStats
  };

  describe('won state', () => {
    const winGameData: GameData = {
      ...endStateBase,
      currentDisplay: 'EGG',
      livesRemaining: 1
    };

    it('should have win message in content', () => {
      const message = generateGameEndMesage(winGameData);
      expect(message.content).toContain('win');
    });

    it('should have single embed message in embeds', () => {
      const message = generateGameEndMesage(winGameData);
      expect(message.embeds).toBeTruthy();
      expect(message.embeds?.length).toBe(1);
    });

    it('should have word in embed description', () => {
      const message = generateGameEndMesage(winGameData);
      const stateEmbed = (message.embeds || [])[0];
      expect(stateEmbed.description).toBe(winGameData.currentWord);
    });

    it('should have fields for game time, wins and losses in embed', () => {
      const message = generateGameEndMesage(winGameData);
      const stateEmbed = (message.embeds || [])[0];
      expect(stateEmbed.fields?.length).toBe(3);

      const gameTimeField = stateEmbed.fields?.find(f => f.name === 'Time taken');
      expect(gameTimeField).toBeTruthy();

      const winsField = stateEmbed.fields?.find(f => f.name === 'Wins');
      expect(winsField).toBeTruthy();
      expect(winsField?.value).toBe(`${mockStats.totalWins}`);

      const lossesField = stateEmbed.fields?.find(f => f.name === 'Losses');
      expect(lossesField).toBeTruthy();
      expect(lossesField?.value).toBe(`${mockStats.totalLosses}`);
    });

    it('should have a word definition button', () => {
      const message = generateGameEndMesage(winGameData);
      expect(message.components?.length).toBe(1);

      const button = (message.components || [])[0].components[0] as MessageButton;
      expect(button.style).toBe('LINK');
      expect(button.label).toBe('Word definition');
      expect(button.url).toContain(winGameData.currentWord.toLowerCase());
    });

    it('should have correct embed colour', () => {
      const message = generateGameEndMesage(winGameData);
      expect(((message.embeds || [])[0] as MessageEmbed).hexColor).toBe(embedColorNormal);
    });

    it('should have thumbnail image', () => {
      const gameData: GameData = mockGame;
      const embed = generateGameEmbed(gameData);
      expect(embed.thumbnail?.url).toBe(`${graphicsRootUrl}${mockGame.livesRemaining}${graphicsExtension}`);
    });
  });

  describe('lost state', () => {
    const loseGameData: GameData = {
      ...endStateBase,
      currentDisplay: '---',
      livesRemaining: 0
    };

    it('should have loss message in content', () => {
      const message = generateGameEndMesage(loseGameData);
      expect(message.content).toContain('lost');
    });

    it('should have single embed message in embeds', () => {
      const message = generateGameEndMesage(loseGameData);
      expect(message.embeds).toBeTruthy();
      expect(message.embeds?.length).toBe(1);
    });

    it('should have word in embed description', () => {
      const message = generateGameEndMesage(loseGameData);
      const stateEmbed = (message.embeds || [])[0];
      expect(stateEmbed.description).toBe(loseGameData.currentWord);
    });

    it('should have fields for game time, wins and losses in embed', () => {
      const message = generateGameEndMesage(loseGameData);
      const stateEmbed = (message.embeds || [])[0];
      expect(stateEmbed.fields?.length).toBe(3);

      const gameTimeField = stateEmbed.fields?.find(f => f.name === 'Time taken');
      expect(gameTimeField).toBeTruthy();

      const winsField = stateEmbed.fields?.find(f => f.name === 'Wins');
      expect(winsField).toBeTruthy();
      expect(winsField?.value).toBe(`${mockStats.totalWins}`);

      const lossesField = stateEmbed.fields?.find(f => f.name === 'Losses');
      expect(lossesField).toBeTruthy();
      expect(lossesField?.value).toBe(`${mockStats.totalLosses}`);
    });

    it('should have a word definition button', () => {
      const message = generateGameEndMesage(loseGameData);
      expect(message.components?.length).toBe(1);

      const button = (message.components || [])[0].components[0] as MessageButton;
      expect(button.style).toBe('LINK');
      expect(button.label).toBe('Word definition');
      expect(button.url).toContain(loseGameData.currentWord.toLowerCase());
    });

    it('should have correct embed colour', () => {
      const message = generateGameEndMesage(loseGameData);
      expect(((message.embeds || [])[0] as MessageEmbed).hexColor).toBe(embedColorError);
    });

    it('should have thumbnail image', () => {
      const gameData: GameData = mockGame;
      const embed = generateGameEmbed(gameData);
      expect(embed.thumbnail?.url).toBe(`${graphicsRootUrl}${mockGame.livesRemaining}${graphicsExtension}`);
    });
  });
});
