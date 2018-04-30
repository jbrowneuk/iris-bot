import { injectable, inject } from 'inversify';

import * as discord from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { TYPES } from '../constants/types';
import { Engine } from '../interfaces/engine';

const token = ''; // DO NOT SUBMIT

@injectable()
export class BotEngine implements Engine {
  constructor(@inject(TYPES.Client) private client: Client) {}

  public run(): void {
    this.attachEvents();
    this.client.connect(token);
  }

  private attachEvents(): void {
    this.client.on(LifecycleEvents.CONNECTED, () => console.log('Connected'));

    this.client.on(LifecycleEvents.MESSAGE, (message: discord.Message) => {
      if (message.content === '+echo') {
        this.client.queueMessages(['echo!'], message.channel);
      }

      if (message.content === '+leave') {
        this.client.disconnect();
      }
    });
  }
}
