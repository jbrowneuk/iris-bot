import { Message, MessageEmbed } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

const apiBase = 'https://media.jbrowne.io/stickers/';
const apiUrl = `${apiBase}stickers.php?name=`;

export const prefix = '+s ';
export const helpText = `Posts a large sticker image to chat. All image names can be found at ${apiBase}`;

interface Sticker {
  name: string;
  url: string;
}

export class Stickers implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    if (message.content.indexOf(prefix) !== 0) {
      return Promise.resolve(null);
    }

    const stickerName = message.content.substring(prefix.length).trim();
    return this.fetchSticker(stickerName);
  }

  onHelp(): Promise<MessageType> {
    const embed = new MessageEmbed();
    embed.setTitle('Stickers (large emotes) plugin');
    embed.setDescription(helpText);

    embed.addField('Commands', `\`${prefix}<sticker name>\``);

    embed.addField('Example', `\`${prefix}hug\``);

    return Promise.resolve(embed);
  }

  private fetchSticker(stickerName: string): Promise<string> {
    return nodeFetch
      .default(apiUrl + stickerName)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch API');
        }

        return response.json();
      })
      .then((rawData) => this.handleStickerResponse(rawData))
      .catch((e) => {
        this.dependencies.logger.error(e);
        return 'Cannot find that sticker';
      });
  }

  private handleStickerResponse(response: Sticker): string {
    return response.url || 'Cannot find that sticker';
  }
}
