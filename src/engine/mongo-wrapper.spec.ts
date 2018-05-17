import { MongoWrapper } from './mongo-wrapper';

describe('MongoDB wrapper', () => {
  it('should create', () => {
    const wrapper = new MongoWrapper();
    expect(wrapper).toBeTruthy();
  });
});
