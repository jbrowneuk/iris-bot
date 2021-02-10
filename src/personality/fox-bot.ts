import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';
import { getValueStartedWith } from '../utils';

const imageApiBase = 'https://some-random-api.ml/img/';
export const supportedApis = ['fox', 'panda', 'red_panda', 'koala', 'birb'];

export class FoxBot implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    if (!message.content.startsWith('+')) {
      return Promise.resolve(null);
    }

    const apiReq = message.content.substring(1).trim();
    const apiEndpoint = getValueStartedWith(apiReq, supportedApis);
    if (!apiEndpoint) {
      return Promise.resolve(null);
    }

    return nodeFetch
      .default(`${imageApiBase}${apiEndpoint}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch API');
        }

        return response.json();
      })
      .then((rawData) => rawData && rawData.link)
      .catch((e) => {
        this.dependencies.logger.error(e);
        return this.dependencies.responses.generateResponse('apiError');
      });
  }
}
