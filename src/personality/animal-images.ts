import * as axios from 'axios';
import { Message, MessageEmbed } from 'discord.js';
import { StatusCodes } from 'http-status-codes';

import { COMMAND_PREFIX } from '../constants/personality-constants';
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

export const helpText = 'This plugin gets random animal pictures from the internet.';

export interface ImageData {
  link?: string;
}

export class AnimalImages implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    if (!message.content.startsWith(COMMAND_PREFIX)) {
      return Promise.resolve(null);
    }

    const apiReq = message.content.substring(1).trim();
    const apiEndpoint = supportedApis.find(api => api.name.startsWith(apiReq));
    if (!apiEndpoint) {
      return Promise.resolve(null);
    }

    return axios.default
      .get<ImageData>(apiEndpoint.url)
      .then(response => {
        if (response.status !== StatusCodes.OK || !response.data.link) {
          throw new Error('Unable to fetch API');
        }

        return response.data;
      })
      .then(rawData => rawData && rawData.link)
      .catch(e => {
        this.dependencies.logger.error(e);
        return this.dependencies.responses.generateResponse('apiError');
      });
  }

  onHelp(): Promise<MessageType> {
    const embed = new MessageEmbed();
    embed.setTitle('Animal Images');
    embed.setDescription(helpText);

    const commands = supportedApis.map(api => `\`${COMMAND_PREFIX}${api.name}\``);
    embed.addFields([{ name: 'Commands', value: commands.join('\n') }]);

    return Promise.resolve(embed);
  }
}
