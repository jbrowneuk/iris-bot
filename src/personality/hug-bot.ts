import { Message, MessageEmbed } from 'discord.js';

import { COMMAND_PREFIX } from '../constants/personality-constants';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

const activities = [
  { request: 'hug', response: 'hug' },
  { request: 'cake', response: '🎂' },
  { request: 'pizza', response: '🍕' },
  { request: 'burger', response: '🍔' },
  { request: 'beer', response: '🍺' },
  { request: 'cookie', response: '🍪' },
  { request: 'salad', response: '🥗' },
  { request: 'stiff drink', response: '🥃' }
];

export const helpText = `This plugin lets you send virtual things to people.`;

export class HugBot implements Personality {
  public onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<string> {
    return this.commandWrapper(message, addressedMessage, 'give a ', ' to');
  }

  public onMessage(message: Message): Promise<string> {
    return this.commandWrapper(message, message.content, COMMAND_PREFIX, '');
  }

  public onHelp(): Promise<MessageType> {
    const embed = new MessageEmbed();
    embed.setTitle('HugBot™');
    embed.setDescription(helpText);

    const commandText = `\`\`\`@bot give a *item* to @name\n\n${COMMAND_PREFIX}*item* @name\`\`\``;
    embed.addField('Commands', commandText);

    embed.addField(
      'Things you can give',
      activities.map((i) => i.request).join(', ')
    );

    embed.addField(
      'Examples',
      '```@bot give a hug to @person\n\n+cake @person```'
    );

    return Promise.resolve(embed);
  }

  private commandWrapper(
    message: Message,
    text: string,
    prefix: string,
    suffix: string
  ): Promise<string> {
    return new Promise((resolve) => {
      let sentMessage = null;
      const send = (messageText: string) => {
        if (messageText === null) {
          return;
        }

        sentMessage = messageText;
      };

      for (const activity of activities) {
        send(
          this.response(
            message,
            text,
            `${prefix}${activity.request}${suffix}`,
            activity.response
          )
        );
      }

      resolve(sentMessage);
    });
  }

  private response(
    message: Message,
    text: string,
    command: string,
    itemOverride?: string
  ): string {
    if (!text.startsWith(command)) {
      return null;
    }

    const item = itemOverride ? itemOverride : command;
    const bits = text.substr(command.length + 1).split(' ');
    const addressedBitIndex = 0;
    if (
      bits[addressedBitIndex].startsWith('<@') &&
      bits[addressedBitIndex].endsWith('>')
    ) {
      return `Gives a ${item} to ${bits[addressedBitIndex]} from <@${message.author.id}>`;
    }

    return null;
  }
}
