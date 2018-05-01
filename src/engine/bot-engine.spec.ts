import { BotEngine } from './bot-engine';

describe('Bot engine', () => {
  it('should construct', () => {
    const engine = new BotEngine(null);
    expect(engine).toBeTruthy();
  });
});
