import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

const randomApiBaseUrl = 'https://some-random-api.ml/img/';
const imageApiBaseUrl = 'https://jbrowne.io/api/image/?query=';
export const supportedApis = [
  { name: 'fox', url: `${randomApiBaseUrl}fox` },
  { name: 'panda', url: `${randomApiBaseUrl}panda` },
  { name: 'redpanda', url: `${randomApiBaseUrl}red_panda` },
  { name: 'koala', url: `${randomApiBaseUrl}koala` },
  { name: 'bird', url: `${randomApiBaseUrl}birb` },
  { name: 'hyena', url: `${imageApiBaseUrl}hyena` },
  { name: 'cat', url: `${imageApiBaseUrl}cat` },
  { name: 'dog', url: `${imageApiBaseUrl}dog` }
];

export const helpText = `This plugin pulls random animal pictures from the internet.
Animals you can search for are \`+${supportedApis
  .map((i) => i.name)
  .join('`, `+')}\`.`;

export class AnimalImages implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    if (!message.content.startsWith('+')) {
      return Promise.resolve(null);
    }

    const apiReq = message.content.substring(1).trim();
    const apiEndpoint = supportedApis.find((api) =>
      api.name.startsWith(apiReq)
    );
    if (!apiEndpoint) {
      return Promise.resolve(null);
    }

    return nodeFetch
      .default(apiEndpoint.url)
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

  onHelp(): Promise<MessageType> {
    return Promise.resolve(helpText);
  }
}
