import { MessageEmbed } from 'discord.js';

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
    embed.addField('Commit information', `${commit}\n${refs}\n${date}`);

    embed.addField(
      'Platform',
      `Node ${process.version} (${process.platform} ${process.arch})`
    );

    embed.addField('Repository', 'https://github.com/jbrowneuk/iris-bot');

    return Promise.resolve(embed);
  }
}
