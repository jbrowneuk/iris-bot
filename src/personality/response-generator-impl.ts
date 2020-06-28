import { Database } from '../interfaces/database';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { randomNumber } from '../utils';

const collectionName = 'responses';

/**
 * Used to randomly select a response from a collection of responses
 */
export class ResponseGeneratorImpl implements ResponseGenerator {
  constructor(private database: Database, private logger: Logger) {}

  /**
   * Generates a response from a collection of responses.
   * Returns a blank string if the phrase or mood is not found.
   *
   * @param phrase the phrase type to generate
   */
  public async generateResponse(phrase: string): Promise<string> {
    const mood = 'none';
    const filter = { type: phrase, mood };
    const responses = await this.database.getRecordsFromCollection(collectionName, filter);
    if (responses.length === 0) {
      this.logger.error('Unable to find a response', phrase, mood);
      return '';
    }

    const choice = randomNumber(responses.length);
    return responses[choice].text;
  }
}
