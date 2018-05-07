import { Personality } from './personality';

export interface Engine {
  addPersonality(personality: Personality): void;
  run(): void;
}
