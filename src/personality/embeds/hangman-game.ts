import { MessageEmbed } from 'discord.js';

import { dictionaryCommand, guessCommand, prefix, startCommand, statsCommand, summaryCommand } from '../constants/hangman-game';
import { DictionaryInfo, GameData } from '../interfaces/hangman-game';

export const embedTitle = 'Hangman';
export const embedColor = '#0080ff';

function generateBaseEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setColor(embedColor);
  return embed;
}

export function generateHelpEmbed(): MessageEmbed {
  const embed = generateBaseEmbed();
  embed.setDescription('Plays a game of hangman using words from web sources.');
  embed.addField('Game summary', `Use \`${prefix} ${summaryCommand}\` to see a summary of the game.`);
  embed.addField('Starting a game', `Use \`${prefix} ${startCommand}\` to start a game.`);
  embed.addField('Making guesses', `Use \`${prefix} ${guessCommand} <your guess>\` to guess a letter or word.`);
  embed.addField('Viewing stats', `Use \`${prefix} ${statsCommand}\` to see the current server stats.`);
  embed.addField('Dictionary', `Use \`${prefix} ${dictionaryCommand}\` to see the current dictionary information.`);

  return embed;
}

export function generateGameEmbed(gameData: GameData): MessageEmbed {
  const embed = generateBaseEmbed();
  const letterDisplay = `\`${gameData.currentDisplay}\``;
  const countDisplay = `(${gameData.currentDisplay.length} letters)`;
  const chanceDisplay = `${gameData.livesRemaining} chances left`;
  embed.setDescription(`${letterDisplay} ${countDisplay}\n${chanceDisplay}`);
  const lettersSummary = gameData.wrongLetters.length > 0 ? gameData.wrongLetters.join() : '*none*';

  const wordsSummary = gameData.wrongWords.length > 0 ? gameData.wrongWords.join() : '*none*';

  embed.addField('Wrong guesses', `Letters: ${lettersSummary}\nWords: ${wordsSummary}`);

  return embed;
}

export function generateStatsEmbed(gameData: GameData): MessageEmbed {
  const embed = generateBaseEmbed();
  embed.setDescription('Statistics for this Discord server');

  embed.addField('Streak', gameData.currentStreak.toString(), true);
  embed.addField('Wins', gameData.totalWins.toString(), true);
  embed.addField('Losses', gameData.totalLosses.toString(), true);

  return embed;
}

export function generateDictionaryEmbed(statsResponse: DictionaryInfo): MessageEmbed {
  const embed = generateBaseEmbed();
  const lines: string[] = [];
  statsResponse.wordLengths.forEach(data => {
    const formattedData = `• ${data['word-length']}-letter words: **${data.count}**`;
    lines.push(formattedData);
  });

  embed.setDescription(`There are ${statsResponse.totalWords} words available.\n\n${lines.join('\n')}`);
  return embed;
}
