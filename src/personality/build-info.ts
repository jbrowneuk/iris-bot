import { MessageEmbed } from 'discord.js';

import { GIT_COMMIT } from '../git-commit';
import { MessageType } from '../types';
import { PersonalityBase } from './personality-base';

export class BuildInfo extends PersonalityBase {
  public onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  public onMessage(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onHelp(): Promise<MessageEmbed> {
    return Promise.resolve(this.getBuildInfo());
  }

  private getBuildInfo(): Promise<MessageEmbed> {
    const embed = new MessageEmbed();
    embed.setTitle('Iris Bot build information');
    embed.setDescription('Your bot is running the iris-bot framework.');

    const commit = `**Commit**: \`${GIT_COMMIT.commit}\``;
    const refs = `**Refs**: \`${GIT_COMMIT.refs}\``;
    const date = `**Date**: \`${GIT_COMMIT.date}\``;
    embed.addFields([
      { name: 'Commit information', value: `${commit}\n${refs}\n${date}` },
      {
        name: 'Platform',
        value: `Node ${process.version} (${process.platform} ${process.arch})`
      },
      { name: 'Repository', value: 'https://github.com/jbrowneuk/iris-bot' }
    ]);

    return Promise.resolve(embed);
  }
}
