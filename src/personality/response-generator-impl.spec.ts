import { ResponseGeneratorImpl } from './response-generator-impl';

describe('response generator', () => {
  it('should create', () => {
    const gen = new ResponseGeneratorImpl();
    expect(gen).toBeTruthy();
  });

  it('should generate a response for a phrase', () => {
    const gen = new ResponseGeneratorImpl();

    const actualResponse = gen.generateResponse('phrase');

    expect(actualResponse).toBe('');
  });
});
