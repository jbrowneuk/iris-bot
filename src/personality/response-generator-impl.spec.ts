import { IMock, It, Mock } from 'typemoq';

import { Database } from '../interfaces/database';
import { Mood, MoodEngine } from '../interfaces/mood-engine';
import { NoResponseText, ResponseGeneratorImpl } from './response-generator-impl';

const mockDbRows = [
  { text: 'a' },
  { text: 'b' },
  { text: 'c' }
];

describe('response generator', () => {
  let database: IMock<Database>;
  let moodEngine: IMock<MoodEngine>;

  beforeEach(() => {
    database = Mock.ofType<Database>();
    moodEngine = Mock.ofType<MoodEngine>();
    moodEngine.setup(e => e.getMood()).returns(() => Mood.Neutral);
  });

  it('should create', () => {
    const gen = new ResponseGeneratorImpl(database.object, console, moodEngine.object);
    expect(gen).toBeTruthy();
  });

  it('should generate a response for a phrase', (done: DoneFn) => {
    database
      .setup(m => m.getRecordsFromCollection(It.isAnyString(), It.isAny()))
      .returns((collection: string) => Promise.resolve(mockDbRows));

    const gen = new ResponseGeneratorImpl(database.object, console, moodEngine.object);

    gen.generateResponse('phrase').then((response: string) => {
      // Verify that the result is equal to one of the texts in the rows
      const mappedToMockRow = mockDbRows.find(x => x.text === response);
      expect(mappedToMockRow).toBeTruthy();
      done();
    });
  });

  it('should return a generic string if no rows are returned from the database', (done: DoneFn) => {
    database
      .setup(m => m.getRecordsFromCollection(It.isAnyString(), It.isAny()))
      .returns((collection: string) => Promise.resolve([]));

    const gen = new ResponseGeneratorImpl(database.object, console, moodEngine.object);

    gen.generateResponse('phrase').then((response: string) => {
      expect(response).not.toBe('');
      expect(response).toBe(NoResponseText)
      done();
    });
  });
});
