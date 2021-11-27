import { Message } from 'discord.js';

import { QueryFilter } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

export const collection = 'tally';
export const addCommand = '+add';
export const totalCountCommand = '+total';
export const resetCountCommand = '+reset';

interface GuildCount {
  guildId: string;
  count: number;
}

function generateWhere(guildId: string): QueryFilter {
  return {
    where: [
      { field: 'guildId', value: guildId }
    ]
  };
}

export class TallyPersonality implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onMessage(message: Message): Promise<MessageType> {
    const { content, guild } = message;

    if (content.includes(addCommand)) {
      return this.addToCounter(guild.id);
    }

    if (content.includes(totalCountCommand)) {
      return this.getCounter(guild.id);
    }

    if (content.includes(resetCountCommand)) {
      return this.resetCounter(guild.id);
    }

    return Promise.resolve(null);
  }

  private addToCounter(guildId: string): Promise<string> {
    return this.dependencies.database
      .getRecordsFromCollection<GuildCount>(collection, generateWhere(guildId))
      .then((results) => {
        if (results.length === 0) {
          const insertObject: GuildCount = {
            guildId: guildId,
            count: 1
          };

          return this.dependencies.database
            .insertRecordsToCollection(collection, { ...insertObject })
            .then(() => {
              this.dependencies.logger.log('Added successfully');
              return 'The tally is 1';
            });
        }

        const updatedCount = results[0].count + 1;
        const fieldInfo = { $count: updatedCount };
        const filter = { $guildId: guildId };

        return this.dependencies.database
          .updateRecordsInCollection(collection, fieldInfo, filter)
          .then(() => {
            this.dependencies.logger.log('Updated successfully');
            return `The tally is ${updatedCount}`;
          });
      })
      .catch((err) => {
        console.error(err);
        return 'Not right now';
      });
  }

  private resetCounter(guildId: string): Promise<string> {
    return this.dependencies.database
      .getRecordsFromCollection<GuildCount>(collection, generateWhere(guildId))
      .then((results) => {
        if (results.length === 0) {
          return 'The counter has never been used'; // Tally is zero for all unkown guilds
        }

        const fieldInfo = { $count: 0 };
        const filter = { $guildId: guildId };

        return this.dependencies.database
          .updateRecordsInCollection(collection, fieldInfo, filter)
          .then(() => {
            this.dependencies.logger.log('Reset successfully');
            return 'Gotcha';
          });
      }).catch((err) => {
        console.error(err);
        return 'Can’t do that right now';
      });
  }

  private getCounter(guildId: string): Promise<string> {
    return this.dependencies.database
      .getRecordsFromCollection<GuildCount>(collection, generateWhere(guildId))
      .then((results) => {
        if (results.length === 0) {
          return 'Zero';
        }

        const row = results[0];
        return `The tally is ${row.count}`;
      })
      .catch((err) => {
        this.dependencies.logger.error(err);
        return 'Zero';
      });
  }
}
