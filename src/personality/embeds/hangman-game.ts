import { MessageEmbed } from 'discord.js';

import { guessCommand, prefix, startCommand } from '../constants/hangman-game';
import { GameState } from '../interfaces/hangman-game';

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
    `Use \`${prefix}\` to see a summary of the game.`
  );
  embed.addField(
    'Starting a game',
    `Use \`${prefix} ${startCommand}\` to start a game.`
  );
  embed.addField(
    'Making guesses',
    `Use \`${prefix} ${guessCommand} <your guess>\` to guess a word or letter.`
  );

  return embed;
}

export function generateGameEmbed(gameState: GameState): MessageEmbed {
  const embed = generateBaseEmbed();
  const letterDisplay = `\`${gameState.currentDisplay}\``;
  const countDisplay = `(${gameState.currentDisplay.length} letters)`;
  const chanceDisplay = `${gameState.livesRemaining} chances left`;
  embed.setDescription(`${letterDisplay} ${countDisplay}\n${chanceDisplay}`);
  const lettersSummary =
    gameState.wrongLetters.length > 0
      ? gameState.wrongLetters.join()
      : '*none*';

  const wordsSummary =
    gameState.wrongWords.length > 0 ? gameState.wrongWords.join() : '*none*';

  embed.addField(
    'Wrong guesses',
    `Letters: ${lettersSummary}\nWords: ${wordsSummary}`
  );

  return embed;
}
