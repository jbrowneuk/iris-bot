import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

const apiUrl = 'https://media.jbrowne.io/stickers/stickers.json';
const prefix = '+s ';

interface Sticker {
  name: string;
  url: string;
}

export class Stickers implements Personality {
  private stickers: Sticker[];

  constructor(private dependencies: DependencyContainer) {}

  initialise(): void {
    nodeFetch
      .default(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch API');
        }

        return response.json();
      })
      .then((rawData) => this.handleStickersResponse(rawData))
      .catch((e) => this.dependencies.logger.error(e));
  }

  onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    if (message.content.indexOf(prefix) !== 0) {
      return Promise.resolve(null);
    }

    const stickerName = message.content.substring(prefix.length).trim();
    const relatedSticker = this.stickers.find((s) => s.name === stickerName);
    if (!relatedSticker) {
      return Promise.resolve(null);
    }

    return Promise.resolve(relatedSticker.url);
  }

  private handleStickersResponse(list: Sticker[]): void {
    if (!Array.isArray(list)) {
      this.stickers = [];
      return;
    }

    this.stickers = list;
  }
}
