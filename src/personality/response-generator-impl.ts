import { Database } from '../interfaces/database';
import { ResponseGenerator } from '../interfaces/response-generator';
import { randomNumber } from '../utils';

const collectionName = 'responses';

/**
 * Used to randomly select a response from a collection of responses
 */
export class ResponseGeneratorImpl implements ResponseGenerator {
  constructor(private database: Database) {}

  /**
   * Generates a response from a collection of responses.
   * Returns a blank string if the phrase or mood is not found.
   *
   * @param phrase the phrase type to generate
   */
  public async generateResponse(phrase: string): Promise<string> {
    const filter = { type: phrase, mood: 'none' };
    const responses = await this.database.getRecordsFromCollection(collectionName, filter);
    if (responses.length === 0) {
      return '';
    }

    const choice = randomNumber(responses.length);
    return responses[choice].text;
  }
}
