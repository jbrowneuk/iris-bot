import * as axios from 'axios';
import { Message } from 'discord.js';
import { StatusCodes } from 'http-status-codes';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

export const commandString = 'TELL ME A JOKE';
export const apiEndpoint = 'https://jbrowne.io/api/jokes/';

export interface ResponseData {
  text: string;
}

export class Jokes implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  public onAddressed(_: Message, addressedMessage: string): Promise<MessageType> {
    if (addressedMessage.toUpperCase().trim() !== commandString) {
      return Promise.resolve(null);
    }

    return this.fetchJokeFromApi();
  }

  public onMessage(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  private fetchJokeFromApi(): Promise<string> {
    return axios.default
      .get<ResponseData>(apiEndpoint)
      .then(response => {
        if (response.status !== StatusCodes.OK || !response.data.text) {
          throw new Error('Unable to fetch API');
        }

        return response.data;
      })
      .then(rawData => rawData && rawData.text)
      .catch(e => {
        this.dependencies.logger.error(e);
        return this.dependencies.responses.generateResponse('apiError');
      });
  }
}
