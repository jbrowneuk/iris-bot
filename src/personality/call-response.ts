import { Message } from 'discord.js';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';

/**
 * Call-Response personality
 *
 * Generates canned responses to messaages
 */
export class CallResponse implements Personality {

  constructor(private dependencies: DependencyContainer) {}

  private get database(): Database {
    return this.dependencies.database;
  }

  public onAddressed(message: Message, addressedMessage: string): Promise<string> {
    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<string> {
    const filter = {
      where: [{
        field: 'call',
        value: message.content
      }]
    };

    return this.database.getRecordsFromCollection('call_response', filter)
      .then(messagePairs => {
        if (!messagePairs || messagePairs.length === 0) {
          return null;
        }

        return messagePairs[0].response || null;
      })
      .catch(() => null);
  }
}