import { ResponseGenerator } from '../interfaces/response-generator';
import { Database } from '../interfaces/database';
import { randomNumber } from '../utils';
import { injectable, inject } from 'inversify';
import { TYPES } from '../constants/types';

const collectionName = 'responses';

@injectable()
export class ResponseGeneratorImpl implements ResponseGenerator {
  constructor(@inject(TYPES.Database) private database: Database) {}

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
