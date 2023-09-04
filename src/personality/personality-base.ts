import { Message } from 'discord.js';

import { PersonalityCollection } from '../engine/personality-collection';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

export abstract class PersonalityBase implements Personality {
  constructor(protected dependencies: DependencyContainer) {
    PersonalityCollection.instance.addPersonality(this);
  }

  abstract onAddressed(message: Message<boolean>, addressedMessage: string): Promise<MessageType>;
  abstract onMessage(message: Message<boolean>): Promise<MessageType>;
}
