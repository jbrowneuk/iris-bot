import { GIT_COMMIT } from '../git-commit';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

export class BuildInfo implements Personality {
  public onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  public onMessage(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onHelp(): Promise<string> {
    return Promise.resolve(this.getBuildInfo());
  }

  private getBuildInfo(): Promise<string> {
    const formattedOutput = `Your bot is running the iris-bot framework.
https://github.com/jbrowneuk/iris-bot
Commit \`${GIT_COMMIT.commit}\` (from \`${GIT_COMMIT.refs}\` on ${GIT_COMMIT.date})
Node ${process.version} (${process.platform} ${process.arch})`;
    return Promise.resolve(formattedOutput);
  }
}
