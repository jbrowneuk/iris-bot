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
    // if addressed, do the addressed loop else
    this.handleAmbientMessage(message);
  }

  private dequeuePromises(funcs: Promise<string>[]): void {
    funcs.reduce(
      (prev: Promise<string>, curr: Promise<string>) => {
        return prev.then((result: string) => {
          if (result !== null) {
            this.client.queueMessages([result]);
            return;
          }

          return curr;
        });
      },
      Promise.resolve(null)
    ).catch((err: Error) => {
      console.error(err);
    });
  }

  private handleAmbientMessage(message: discord.Message): void {
    const funcs = this.personalityConstructs.map((c: Personality) => c.onMessage(message));
    funcs.push(Promise.resolve(null));
    this.dequeuePromises(funcs);
  }
}
