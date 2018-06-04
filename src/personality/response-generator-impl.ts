import { ResponseGenerator } from '../interfaces/response-generator';
import { Database } from '../interfaces/database';
import { randomNumber } from '../utils';

const collectionName = 'responses';

export class ResponseGeneratorImpl implements ResponseGenerator {
  constructor(private database: Database) {}

  public async generateResponse(phrase: string): Promise<string> {
    const filter = { responseType: phrase };
    const responses = await this.database.getRecordsFromCollection(collectionName, filter);
    if (responses.length === 0) {
      return '';
    }

    const choice = randomNumber(responses.length);
    return responses[choice].text;
  }
}
