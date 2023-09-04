import * as axios from 'axios';
import { Message, MessageEmbed } from 'discord.js';
import { StatusCodes } from 'http-status-codes';

import { COMMAND_PREFIX } from '../constants/personality-constants';
import { DependencyContainer } from '../interfaces/dependency-container';
import { MessageType } from '../types';
import { PersonalityBase } from './personality-base';

const stickerReferenceUrl = 'https://jbrowne.io/iris-bot/stickers/';
const apiUrl = 'https://jbrowne.io/api/stickers/index.php';

export const prefix = COMMAND_PREFIX + 's ';
export const helpText = `Posts a large sticker image to chat. All image names can be found at ${stickerReferenceUrl}`;

export interface Sticker {
  name: string;
  url: string;
}

export class Stickers extends PersonalityBase {
  constructor(dependencies: DependencyContainer) {
    super(dependencies);
  }

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

    embed.addFields([
      { name: 'Commands', value: `\`${prefix}<sticker name>\`` },
      { name: 'Example', value: `\`${prefix}hug\`` }
    ]);

    return Promise.resolve(embed);
  }

  private fetchSticker(stickerName: string): Promise<string> {
    return axios.default
      .get<Sticker>(apiUrl + stickerName)
      .then(response => {
        if (response.status !== StatusCodes.OK || !response.data.url) {
          throw new Error('Unable to fetch API');
        }

        return this.handleStickerResponse(response.data);
      })
      .catch(e => {
        this.dependencies.logger.error(e);
        return 'Cannot find that sticker';
      });
  }

  private handleStickerResponse(response: Sticker): string {
    return response.url || 'Cannot find that sticker';
  }
}
