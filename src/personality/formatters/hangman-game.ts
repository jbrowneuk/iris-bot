import { MessageEmbed } from 'discord.js';

import { Hangman } from '../../interfaces/personality/hangman';

export function hangmanResponse(gameInfo: Hangman): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle('Hangman');

  const remainingLives = gameInfo.getGuessesRemaining();
  const lifeText = `${gameInfo.getGuessesRemaining()} live${
    remainingLives === 1 ? '' : 's'
  } left`;
  const letterText = `${gameInfo.getLettersToDisplay()}\n${lifeText}`;

  embed.addField('Game', letterText);
  embed.addField(
    'Incorrect guesses',
    `Letters: ${gameInfo
      .getIncorrectLetters()
      .join(', ')}\nWords: ${gameInfo.getIncorrectWords().join(', ')}`
  );

  return embed;
}
