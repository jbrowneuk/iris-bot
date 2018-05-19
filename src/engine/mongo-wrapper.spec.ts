import { IMock, Mock, It, Times } from 'typemoq';
import { MongoWrapper } from './mongo-wrapper';
import { MongoClient, Db, Collection, Cursor } from 'mongodb';

describe('MongoDB wrapper', () => {
  let mockClient: IMock<MongoClient>;
  let mockDb: IMock<Db>;

  beforeEach(() => {
    mockClient = Mock.ofType<MongoClient>();
    mockDb = Mock.ofType<Db>();
    mockClient.setup(m => m.db(It.isAnyString())).returns(() => mockDb.object);
  });

  it('should create', () => {
    const wrapper = new MongoWrapper();
    expect(wrapper).toBeTruthy();
  });

  it('should connect and select database', (done: DoneFn) => {
    mockClient.setup(m => m.connect()).returns(() => Promise.resolve(null));
    const wrapper = new MongoWrapper();
    const untypedWrapper = wrapper as any;
    spyOn(untypedWrapper, 'generateClient').and.returnValue(mockClient.object);

    wrapper.connect();

    setTimeout(() => {
      mockClient.verify(m => m.connect(), Times.once());
      mockClient.verify(m => m.db('testproject'), Times.once());
      done();
    });
  });

  it('should disconnect if has a connection', (done: DoneFn) => {
    mockClient.setup(m => m.close()).returns(() => Promise.resolve());
    const wrapper = new MongoWrapper();
    const untypedWrapper = wrapper as any;
    untypedWrapper.client = mockClient.object;

    wrapper.disconnect();

    setTimeout(() => {
      expect(untypedWrapper.client).toBeNull();
      done();
    });
  });

  it('should retrieve records', () => {
    const collectionName = 'testCollection';
    const filter = { tags: 'a tag' };
    const mockDoc = { id: 'ABC123', tags: 'a tag' };
    const mockCollection = Mock.ofType<Collection>();
    const mockCursor = Mock.ofType<Cursor>();
    mockDb
      .setup(m => m.collection(It.isAnyString()))
      .returns(() => mockCollection.object);
    mockCollection
      .setup(m => m.find(It.isAny()))
      .returns(() => mockCursor.object);
    mockCursor
      .setup(m => m.forEach(It.isAny(), It.isAny()))
      .returns((it: Function, err: Function) => {
        it(mockDoc);
      });

    const wrapper = new MongoWrapper();
    const untypedWrapper = wrapper as any;
    untypedWrapper.db = mockDb.object;

    const results = wrapper.getRecordsFromCollection(collectionName, filter);

    mockDb.verify(m => m.collection(It.isValue(collectionName)), Times.once());
    mockCollection.verify(m => m.find(It.isValue(filter)), Times.once());

    expect(results.length).toBe(1);
    expect(results[0]).toEqual(mockDoc);
  });

  it('should return empty array on error when retreiving records', () => {
    const collectionName = 'testCollection';
    const mockError = { message: 'fail' };
    const mockCollection = Mock.ofType<Collection>();
    const mockCursor = Mock.ofType<Cursor>();
    mockDb
      .setup(m => m.collection(It.isAnyString()))
      .returns(() => mockCollection.object);
    mockCollection
      .setup(m => m.find(It.isAny()))
      .returns(() => mockCursor.object);
    mockCursor
      .setup(m => m.forEach(It.isAny(), It.isAny()))
      .returns((it: Function, err: Function) => {
        err(mockError);
      });
    spyOn(console, 'error');

    const wrapper = new MongoWrapper();
    const untypedWrapper = wrapper as any;
    untypedWrapper.db = mockDb.object;

    const results = wrapper.getRecordsFromCollection(collectionName, {});

    expect(results.length).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      `Could not fetch records from ${collectionName}`,
      mockError.message
    );
  });
});
