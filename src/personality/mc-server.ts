import * as axios from 'axios';
import { Message, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { StatusCodes } from 'http-status-codes';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';
import { announceCommand, setCommand, statusCommand } from './constants/mc-server';
import {
  generateAnnounceNoAssociationEmbed,
  generateAnnounceSuccessEmbed,
  generateHelpEmbed,
  generateServerEmbed,
  generateSetFailureEmbed,
  generateSetSuccessEmbed,
  generateStatusFailureEmbed
} from './embeds/mc-server';
import { ServerInformation, ServerResponse } from './interfaces/mc-server';

// Personality constants
const updateMinutes = 5;
const defaultSettingsFile = 'mc-servers.json';
const settingsFileEnc = 'utf-8';
const apiEndpoint = 'https://api.mcstatus.io/v2/status/java/';

export class McServer implements Personality {
  protected servers: Map<string, ServerInformation>;
  protected timerInterval: number | NodeJS.Timer;

  constructor(private dependencies: DependencyContainer) {
    this.servers = new Map<string, ServerInformation>();
  }

  public initialise(): void {
    const updateInterval = updateMinutes * 60 * 1000;
    this.timerInterval = setInterval(this.fetchStatuses.bind(this), updateInterval);

    fs.readFile(defaultSettingsFile, settingsFileEnc, this.parseServers.bind(this));
  }

  public destroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval as number);
      this.timerInterval = null;
    }
  }

  public onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<MessageType> {
    const messageText = message.content.toUpperCase();
    if (messageText === statusCommand) {
      return this.handleStatusCommand(message);
    }

    if (messageText.startsWith(setCommand)) {
      return this.handleSetCommand(message);
    }

    if (messageText === announceCommand) {
      return this.handleAnnounceCommand(message);
    }

    return Promise.resolve(null);
  }

  public onHelp(): Promise<MessageType> {
    return Promise.resolve(generateHelpEmbed());
  }

  protected fetchStatuses(): void {
    this.servers.forEach(serverDetails => {
      const preCheckStatus = serverDetails.lastKnownOnline;

      this.fetchStatus(serverDetails).then(response => {
        const postCheckStatus = serverDetails.lastKnownOnline;
        if (preCheckStatus === postCheckStatus) {
          return;
        }

        // Control posting to channel
        if (!serverDetails.channelId) {
          return;
        }

        const channel = this.dependencies.client.findChannelById(serverDetails.channelId) as TextChannel;

        if (!channel || channel === null) {
          return;
        }

        channel.send({ embeds: [generateServerEmbed(serverDetails.url, response)] });
      });
    });
  }

  private handleStatusCommand(message: Message): Promise<MessageType> {
    if (!this.servers.has(message.guild.id)) {
      const embed = generateStatusFailureEmbed();
      return Promise.resolve(embed);
    }

    const minecraftServer = this.servers.get(message.guild.id);
    return this.fetchStatus(minecraftServer).then(response => generateServerEmbed(minecraftServer.url, response));
  }

  private handleSetCommand(message: Message): Promise<MessageType> {
    const bits = message.content.toUpperCase().split(' ');
    if (bits.length === 1) {
      return Promise.resolve(generateSetFailureEmbed());
    }

    const serverUrl = bits[1].toLowerCase();
    const details: ServerInformation = {
      url: serverUrl,
      channelId: null,
      lastKnownOnline: false
    };
    this.servers.set(message.guild.id, details);

    this.saveServers();
    return Promise.resolve(generateSetSuccessEmbed(message.guild.name, serverUrl));
  }

  private handleAnnounceCommand(message: Message): Promise<MessageType> {
    if (!this.servers.has(message.guild.id)) {
      return Promise.resolve(generateAnnounceNoAssociationEmbed());
    }

    const serverInfo = this.servers.get(message.guild.id);
    const textChannel = message.channel as TextChannel;
    serverInfo.channelId = textChannel.id;

    this.saveServers();
    return Promise.resolve(generateAnnounceSuccessEmbed(serverInfo.url, textChannel.name));
  }

  private fetchStatus(serverDetails: ServerInformation): Promise<ServerResponse> {
    return this.getServerStatus(serverDetails.url).then(status => {
      const isOnline = status !== null && status.online;
      serverDetails.lastKnownOnline = isOnline;
      return status;
    });
  }

  protected getServerStatus(url: string): Promise<ServerResponse> {
    return axios.default
      .get<ServerResponse>(apiEndpoint + url)
      .then(response => {
        if (response.status !== StatusCodes.OK) {
          throw new Error('Unable to fetch API');
        }

        // Handle Aternos/Exaroton servers which have a "Sleeping" state in the version
        const versionRegex = /\b\d+(\.\d+){1,2}\b/;
        const matches = response.data?.version?.name_clean?.match(versionRegex) || null;
        if (matches === null || matches.length === 0) {
          return null;
        }

        return response.data;
      })
      .catch(error => {
        this.dependencies.logger.error('Server unreachable:', error || 'no error');
        return null;
      });
  }

  private parseServers(err: NodeJS.ErrnoException, data: string): void {
    if (err || !data) {
      let message = 'Unable to read server file';
      if (err) {
        message = err.message;
      }

      return this.dependencies.logger.error(message);
    }

    const parsed = JSON.parse(data);
    const keys = Object.keys(parsed);
    for (const key of keys) {
      const serverData = parsed[key];
      const restored: ServerInformation = {
        url: serverData.url,
        channelId: serverData.channelId,
        lastKnownOnline: false
      };

      this.servers.set(key, restored);
    }
  }

  private saveServers(): void {
    const settingsObj: { [key: string]: ServerInformation } = {};
    this.servers.forEach((value, key) => {
      settingsObj[key] = value;
    });

    fs.writeFile(defaultSettingsFile, JSON.stringify(settingsObj), settingsFileEnc, err => {
      if (err) {
        return this.dependencies.logger.error(err);
      }
    });
  }
}
