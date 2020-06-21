import { Personality } from './personality';

export interface Engine {
  /** Add a personality implementation to the bot */
  addPersonality(personality: Personality): void;

  /** Initialise the bot and all personality implementations */
  initialise(): void;

  /** Connect to the server and process messages */
  run(): void;
}
