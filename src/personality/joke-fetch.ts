import * as axios from 'axios';
import { Message } from 'discord.js';
import { StatusCodes } from 'http-status-codes';

import { DependencyContainer } from '../interfaces/dependency-container';
import { MessageType } from '../types';
import { PersonalityBase } from './personality-base';

export const commandString = 'TELL ME A JOKE';
export const apiEndpoint = 'https://jbrowne.io/api/jokes/';

export interface ResponseData {
  text: string;
}

export class Jokes extends PersonalityBase {
  constructor(dependencies: DependencyContainer) {
    super(dependencies);
  }

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
