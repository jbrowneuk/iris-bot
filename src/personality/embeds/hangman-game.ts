import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from 'discord.js';

import {
  dictionaryCommand,
  graphicsExtension,
  graphicsRootUrl,
  guessCommand,
  prefix,
  startCommand,
  statsCommand,
  summaryCommand
} from '../constants/hangman-game';
import { DictionaryInfo, GameData } from '../interfaces/hangman-game';
import { convertMsecToHumanReadable, pluraliseWord } from '../utilities/hangman-game';

export const embedTitle = 'Hangman';
export const embedColorNormal = '#0080ff';
export const embedColorError = '#ff0000';

function generateBaseEmbed(useDefaultColor = true): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setColor(useDefaultColor ? embedColorNormal : embedColorError);
  return embed;
}

export function generateHelpEmbed(): MessageEmbed {
  const embed = generateBaseEmbed();
  embed.setDescription('Plays a game of hangman using words from web sources.');
  embed.addFields([
    { name: 'Game summary', value: `Use \`${prefix} ${summaryCommand}\` to see a summary of the game.` },
    { name: 'Starting a game', value: `Use \`${prefix} ${startCommand}\` to start a game.` },
    { name: 'Making guesses', value: `Use \`${prefix} ${guessCommand} <your guess>\` to guess a letter or word.` },
    { name: 'Viewing stats', value: `Use \`${prefix} ${statsCommand}\` to see the current server stats.` },
    { name: 'Dictionary', value: `Use \`${prefix} ${dictionaryCommand}\` to see the current dictionary information.` }
  ]);

  return embed;
}

export function generateGameEmbed(gameData: GameData, useDefaultColor?: boolean): MessageEmbed {
  const embed = generateBaseEmbed(useDefaultColor);
  const letterDisplay = `\`${gameData.currentDisplay}\``;
  const countDisplay = `(${gameData.currentDisplay.length} letters)`;
  const chanceDisplay = `${gameData.livesRemaining} ${pluraliseWord('chance', gameData.livesRemaining)} left`;
  embed.setDescription(`${letterDisplay} ${countDisplay}\n${chanceDisplay}`);
  embed.setThumbnail(`${graphicsRootUrl}${gameData.livesRemaining}${graphicsExtension}`);

  const lettersSummary = gameData.wrongLetters.length > 0 ? gameData.wrongLetters.join() : '*none*';
  const wordsSummary = gameData.wrongWords.length > 0 ? gameData.wrongWords.join() : '*none*';
  embed.addFields([{ name: 'Wrong guesses', value: `Letters: ${lettersSummary}\nWords: ${wordsSummary}` }]);

  return embed;
}

export function generateStatsEmbed(gameData: GameData): MessageEmbed {
  const embed = generateBaseEmbed();
  embed.setDescription('Statistics for this Discord server');

  embed.addFields([
    { name: 'Streak', value: gameData.currentStreak.toString(), inline: true },
    { name: 'Wins', value: gameData.totalWins.toString(), inline: true },
    { name: 'Losses', value: gameData.totalLosses.toString(), inline: true }
  ]);

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

export function generateGameEndMesage(gameData: GameData): MessageOptions {
  const isLoss = gameData.livesRemaining === 0;
  const content = isLoss ? `You’ve lost - bad luck!` : `That’s a win - congrats!`;

  const summaryEmbed = generateBaseEmbed(!isLoss);
  summaryEmbed.setDescription(gameData.currentWord);
  summaryEmbed.setThumbnail(`${graphicsRootUrl}${gameData.livesRemaining}${graphicsExtension}`);

  const timeTaken = Date.now() - gameData.timeStarted;

  summaryEmbed.addFields([
    { name: 'Time taken', value: convertMsecToHumanReadable(timeTaken), inline: false },
    { name: 'Wins', value: gameData.totalWins.toString(), inline: true },
    { name: 'Losses', value: gameData.totalLosses.toString(), inline: true }
  ]);

  const definitionButton = new MessageButton({
    style: 'LINK',
    url: `https://dictionary.cambridge.org/dictionary/english/${gameData.currentWord.toLowerCase()}`,
    label: 'Word definition'
  });

  const buttonRow = new MessageActionRow();
  buttonRow.addComponents(definitionButton);

  return {
    content,
    embeds: [summaryEmbed],
    components: [buttonRow]
  };
}
