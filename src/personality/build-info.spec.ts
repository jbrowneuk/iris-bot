import { MessageEmbed } from 'discord.js';

import { GIT_COMMIT } from '../git-commit';
import { BuildInfo } from './build-info';

describe('Build Information', () => {
  let personality: BuildInfo;

  beforeEach(() => {
    personality = new BuildInfo();
  });

  it('should not handle a non-addressed message', (done) => {
    personality.onMessage().then((result) => {
      expect(result).toBe(null);
      done();
    });
  });

  it('should not handle an addressed message', (done) => {
    personality.onAddressed().then((result) => {
      expect(result).toBe(null);
      done();
    });
  });

  describe('Help text', () => {
    it('should respond with help text contianing git commit information', (done) => {
      personality.onHelp().then((response) => {
        const embed = response as MessageEmbed;

        const commitField = embed.fields.find((f) => f.name.includes('Commit'));
        expect(commitField.value).toContain(GIT_COMMIT.commit);
        expect(commitField.value).toContain(GIT_COMMIT.refs);
        done();
      });
    });
  });
});
