import { Database, QueryFilter, QueryLogic } from '../interfaces/database';
import { Logger } from '../interfaces/logger';
import { MoodEngine } from '../interfaces/mood-engine';
import { ResponseGenerator } from '../interfaces/response-generator';
import { randomNumber } from '../utils';

const collectionName = 'responses';

export const NoResponseText = 'Nothing to say to that…';

/**
 * Used to randomly select a response from a collection of responses
 */
export class ResponseGeneratorImpl implements ResponseGenerator {
  constructor(
    private database: Database,
    private logger: Logger,
    private moodEngine: MoodEngine
  ) {}

  /**
   * Generates a response from a collection of responses.
   * Returns a blank string if the phrase or mood is not found.
   *
   * @param phrase the phrase type to generate
   */
  public async generateResponse(phrase: string): Promise<string> {
    const mood = this.moodEngine.getMood();
    const filter: QueryFilter = {
      where: [
        {
          field: 'type',
          value: phrase
        },
        {
          field: 'mood',
          value: mood,
          logic: QueryLogic.And
        }
      ]
    };

    const responses = await this.database.getRecordsFromCollection(
      collectionName,
      filter
    );
    if (responses.length === 0) {
      this.logger.error('Unable to find a response', phrase, mood);
      return NoResponseText;
    }

    const choice = randomNumber(responses.length);
    return responses[choice].text;
  }
}
