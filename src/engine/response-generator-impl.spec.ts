import { IMock, It, Mock } from 'typemoq';

import { Database, QueryFilter } from '../interfaces/database';
import { Logger } from '../interfaces/logger';
import { Mood, MoodEngine } from '../interfaces/mood-engine';
import { NoResponseText, ResponseGeneratorImpl } from './response-generator-impl';

const mockDbRows = [{ text: 'a' }, { text: 'b' }, { text: 'c' }];

describe('response generator', () => {
  let mockLogger: IMock<Logger>;
  let database: IMock<Database>;
  let moodEngine: IMock<MoodEngine>;
  let responseGenerator: ResponseGeneratorImpl;
  let currentMood: Mood;

  beforeEach(() => {
    currentMood = Mood.Neutral;
    mockLogger = Mock.ofType<Logger>();
    database = Mock.ofType<Database>();
    moodEngine = Mock.ofType<MoodEngine>();
    moodEngine.setup(e => e.getMood()).returns(() => currentMood);

    responseGenerator = new ResponseGeneratorImpl(database.object, mockLogger.object, moodEngine.object);
  });

  it('should create', () => {
    expect(responseGenerator).toBeTruthy();
  });

  it('should generate a response for a phrase', (done: DoneFn) => {
    database.setup(m => m.getRecordsFromCollection(It.isAnyString(), It.isAny())).returns(() => Promise.resolve(mockDbRows));

    responseGenerator.generateResponse('phrase').then((response: string) => {
      // Verify that the result is equal to one of the texts in the rows
      const mappedToMockRow = mockDbRows.find(x => x.text === response);
      expect(mappedToMockRow).toBeTruthy();
      done();
    });
  });

  it('should return a generic string if no rows are returned from the database', (done: DoneFn) => {
    database.setup(m => m.getRecordsFromCollection(It.isAnyString(), It.isAny())).returns(() => Promise.resolve([]));

    responseGenerator.generateResponse('phrase').then((response: string) => {
      expect(response).not.toBe('');
      expect(response).toBe(NoResponseText);
      done();
    });
  });

  it('should return positive and neutral phrases if mood is positive', (done: DoneFn) => {
    currentMood = Mood.Positive;

    let cachedFilter: QueryFilter;

    database
      .setup(m => m.getRecordsFromCollection(It.isAnyString(), It.isAny()))
      .callback((_: string, filter: QueryFilter) => {
        cachedFilter = filter;
      })
      .returns(() => Promise.resolve([]));

    responseGenerator.generateResponse('phrase').then(() => {
      const moodClauses = cachedFilter.where.filter(clause => clause.field === 'mood');

      expect(moodClauses.find(c => c.value === Mood.Positive)).toBeTruthy();
      expect(moodClauses.find(c => c.value === Mood.Neutral)).toBeTruthy();
      done();
    });
  });

  it('should return negative and neutral phrases if mood is negative', (done: DoneFn) => {
    currentMood = Mood.Negative;

    let cachedFilter: QueryFilter;

    database
      .setup(m => m.getRecordsFromCollection(It.isAnyString(), It.isAny()))
      .callback((_: string, filter: QueryFilter) => {
        cachedFilter = filter;
      })
      .returns(() => Promise.resolve([]));

    responseGenerator.generateResponse('phrase').then(() => {
      const moodClauses = cachedFilter.where.filter(clause => clause.field === 'mood');

      expect(moodClauses.find(c => c.value === Mood.Negative)).toBeTruthy();
      expect(moodClauses.find(c => c.value === Mood.Neutral)).toBeTruthy();
      done();
    });
  });
});
