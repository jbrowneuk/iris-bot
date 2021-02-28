import { McServer } from './mc-server';

describe('Minecraft server utilities', () => {
  let personality: McServer;

  beforeEach(() => {
    personality = new McServer();
  });

  describe('Ambient messages', () => {
    it('should resolve to null', (done) => {
      personality.onMessage().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Addressed messages', () => {
    it('should resolve to null', (done) => {
      personality.onAddressed().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Help messages', () => {
    it('should resolve to null', (done) => {
      personality.onHelp().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });
});
