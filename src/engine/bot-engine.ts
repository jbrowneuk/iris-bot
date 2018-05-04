import { injectable, inject } from 'inversify';

import * as discord from 'discord.js';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { TYPES } from '../constants/types';
import { Client } from '../interfaces/client';
import { Engine } from '../interfaces/engine';
import { Personality } from '../interfaces/personality';

const token = ''; // DO NOT SUBMIT

@injectable()
export class BotEngine implements Engine {
  private personalityConstructs: Personality[];

  constructor(@inject(TYPES.Client) private client: Client) {
    this.personalityConstructs = [];
  }

  public addPersonality(personality: Personality): void {
    this.personalityConstructs.push(personality);
  }

  public run(): void {
    this.attachEvents();
    this.client.connect(token);
  }

  private attachEvents(): void {
    this.client.on(LifecycleEvents.CONNECTED, () => this.onConnected());
    this.client.on(LifecycleEvents.MESSAGE, (message: discord.Message) =>
      this.onMessage(message)
    );
  }

  private onConnected(): void {
    console.log('Connected');
  }

  private onMessage(message: discord.Message): void {
    if (message.content === '+echo') {
      this.client.queueMessages(['echo!'], message.channel);
    }

    if (message.content === '+leave') {
      this.client.disconnect();
    }
  }
}
