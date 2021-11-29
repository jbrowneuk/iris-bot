import { MessageEmbed } from 'discord.js';

import {
  guessCommand,
  prefix,
  startCommand,
  statsCommand,
  summaryCommand
} from '../constants/hangman-game';
import { GameData } from '../interfaces/hangman-game';

const embedTitle = 'Hangman';

function generateBaseEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  return embed;
}

export function generateHelpEmbed(): MessageEmbed {
  const embed = generateBaseEmbed();
  embed.setDescription('Plays a game of hangman using words from web sources.');
  embed.addField(
    'Game summary',
    `Use \`${prefix} ${summaryCommand}\` to see a summary of the game.`
  );
  embed.addField(
    'Starting a game',
    `Use \`${prefix} ${startCommand}\` to start a game.`
  );
  embed.addField(
    'Making guesses',
    `Use \`${prefix} ${guessCommand} <your guess>\` to guess a letter or word.`
  );
  embed.addField(
    'Viewing stats',
    `Use \`${prefix} ${statsCommand}\` to see the current server stats.`
  );

  return embed;
}

export function generateGameEmbed(gameData: GameData): MessageEmbed {
  const embed = generateBaseEmbed();
  const letterDisplay = `\`${gameData.currentDisplay}\``;
  const countDisplay = `(${gameData.currentDisplay.length} letters)`;
  const chanceDisplay = `${gameData.livesRemaining} chances left`;
  embed.setDescription(`${letterDisplay} ${countDisplay}\n${chanceDisplay}`);
  const lettersSummary =
    gameData.wrongLetters.length > 0 ? gameData.wrongLetters.join() : '*none*';

  const wordsSummary =
    gameData.wrongWords.length > 0 ? gameData.wrongWords.join() : '*none*';

  embed.addField(
    'Wrong guesses',
    `Letters: ${lettersSummary}\nWords: ${wordsSummary}`
  );

  return embed;
}

export function generateStatsEmbed(gameData: GameData): MessageEmbed {
  const embed = generateBaseEmbed();
  embed.setDescription('Statistics for this Discord server');

  embed.addField('Current win streak', gameData.currentStreak);
  embed.addField('Total wins', gameData.totalWins);
  embed.addField('Total losses', gameData.totalLosses);

  return embed;
}
