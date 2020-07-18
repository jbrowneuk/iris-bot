import { Message, RichEmbed, TextChannel } from 'discord.js';
import { readFile, writeFile } from 'fs';
import * as nodeFetch from 'node-fetch';

import { PostData } from '../interfaces/blog-roll';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { calculateReadTime, formatTimestamp } from './blog-roll.utils';

const defaultUpdateMins = 60;
const defaultSettingsFile = 'blog-roll.json';
const settingsFileEnc = 'utf-8';

const siteRoot = 'https://jbrowne.io/'
const apiPath = 'api/?posts';

export class BlogRoll implements Personality {
  protected timerInterval: number | NodeJS.Timer;
  protected channelId: string;
  protected lastPostId: number;

  constructor(private dependencies: DependencyContainer, private settingsFilePath: string = defaultSettingsFile) {
    this.lastPostId = 0;
  }

  public initialise(): void {
    readFile(this.settingsFilePath, settingsFileEnc, this.parseSettings.bind(this));

    const updateInterval = defaultUpdateMins * 60 * 1000; // Convert to msec
    this.timerInterval = setInterval(this.fetchJournal.bind(this), updateInterval);
  }

  public onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<string> {
    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<string> {
    if (message.content === '+set channel') {
      const textChannel = message.channel as TextChannel;
      this.channelId = textChannel.id;
      this.saveSettings();
      return Promise.resolve(`Sure, I’ll use the channel *#${textChannel.name}* for blog updates.`);
    }

    return Promise.resolve(null);
  }

  protected fetchJournal(): void {
    nodeFetch.default(`${siteRoot}${apiPath}`).then(response => {
      if (!response.ok) {
        this.dependencies.logger.error('Unable to fetch API');
        return;
      }

      return response.json();
    })
    .then(rawData => this.handlePostResponse(rawData))
    .catch(e => this.dependencies.logger.error(e));
  }

  private parseSettings(err: NodeJS.ErrnoException, data: string): void {
    if (err) {
      return this.dependencies.logger.error(err.message);
    }

    const parsed = JSON.parse(data);
    this.channelId = parsed.channelId || null;
    this.lastPostId = parsed.lastPostId || 0
  }

  private saveSettings(): void {
    const settingsObj = {
      channelId: this.channelId,
      lastPostId: this.lastPostId
    };

    writeFile(this.settingsFilePath, JSON.stringify(settingsObj), settingsFileEnc, (err) => {
      if(err) {
        return this.dependencies.logger.error(err);
      }

      this.dependencies.logger.log('Wrote settings file');
    });
  }

  private getChannel(): TextChannel {
    if (!this.channelId) {
      return null;
    }

    const channel = this.dependencies.client.findChannelById(
      this.channelId
    ) as TextChannel;

    if (!channel) {
      this.dependencies.logger.error('Channel with stored ID not found!');
      this.channelId = null;
      return null;
    }

    return channel;
  }

  private handlePostResponse(rawData: any) {
    if (!rawData) {
      this.dependencies.logger.log('No API response');
      return;
    }

    const posts: PostData[] = rawData.posts || [];
    if (posts.length === 0) {
      this.dependencies.logger.log('No posts found');
      return;
    }

    const post = posts[0];
    if (post.postId <= this.lastPostId) {
      this.dependencies.logger.log('No new posts');
      return;
    }

    this.sendPostUpdate(post);
  }

  private sendPostUpdate(post: PostData): void {
    const channel = this.getChannel();
    if (!channel) {
      return;
    }

    // Update saved last post ID
    this.lastPostId = post.postId;
    this.saveSettings();

    channel.send('New post!', this.formatPostData(post));
  }

  /**
   * Formats the post data into a discord message embed
   *
   * @param postData post information from API
   */
  private formatPostData(postData: PostData): RichEmbed {
    const embed = new RichEmbed();
    embed.setColor('#48647F');
    embed.setURL(`${siteRoot}journal/post/${postData.slug}`);
    embed.setThumbnail(`${siteRoot}icons/icon-120.png`);

    const postedOn = formatTimestamp(postData.date);
    const readTime = calculateReadTime(postData.content);
    const tags = postData.tags.join(', ');

    embed.setTitle(postData.title);
    embed.setDescription(`Posted on ${postedOn}\nTagged ${tags}\n\n${readTime}`);

    return embed;
  }
}
