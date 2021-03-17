import { Message, MessageEmbed, TextChannel } from 'discord.js';
import * as fs from 'fs';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

// This has to be const util = require as it breaks the build if not
const util = require('minecraft-server-util');

export interface ServerInformation {
  url: string;
  channelId: string;
  lastKnownOnline: boolean;
}

export interface ServerPlayer {
  name: string;
}

export interface ServerResponse {
  version: string;
  onlinePlayers: number;
  maxPlayers: number;
  samplePlayers: ServerPlayer[];
}

// Personality constants
const embedTitle = 'Server info';
const embedErrorColor = 0xff8000;
const embedSuccessColor = 0x0080ff;
const updateMinutes = 5;
const defaultSettingsFile = 'mc-servers.json';
const settingsFileEnc = 'utf-8';

// Response texts
export const noAssociationCopy =
  'No Minecraft server associated with this Discord';
export const linkServerCopy = 'Linked the server to this Discord.';

// Commands
export const statusCommand = '+MCSTATUS';
export const setCommand = '+MCSET';
export const announceCommand = '+MCANNOUNCE';

export class McServer implements Personality {
  protected servers: Map<string, ServerInformation>;
  protected timerInterval: number | NodeJS.Timer;

  constructor(private dependencies: DependencyContainer) {
    this.servers = new Map<string, ServerInformation>();
  }

  public initialise(): void {
    const updateInterval = updateMinutes * 60 * 1000;
    this.timerInterval = setInterval(
      this.fetchStatuses.bind(this),
      updateInterval
    );

    fs.readFile(
      defaultSettingsFile,
      settingsFileEnc,
      this.parseServers.bind(this)
    );
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
    const embed = new MessageEmbed();
    embed.setColor(embedSuccessColor);
    embed.setTitle('Minecraft Server Plugin');
    embed.setDescription(
      'Allows you to check the status of a Minecraft server.'
    );
    embed.addField(
      `Command: ${setCommand} <url>`,
      'Associates a Minecraft server with this Discord server.',
      false
    );
    embed.addField(
      `Command: ${statusCommand} <url>`,
      'Checks the status of the associated Minecraft server.',
      false
    );
    embed.addField(
      `Command: ${announceCommand} <url>`,
      'Makes the bot announce status changes of the associated Minecraft server to this channel.',
      false
    );

    return Promise.resolve(embed);
  }

  protected fetchStatuses(): void {
    this.servers.forEach(this.fetchStatus.bind(this));
  }

  private handleStatusCommand(message: Message): Promise<MessageType> {
    const embed = new MessageEmbed();
    embed.setTitle(embedTitle);

    if (!this.servers.has(message.guild.id)) {
      embed.setDescription(noAssociationCopy);
      embed.setColor(embedErrorColor);
      return Promise.resolve(embed);
    }

    const minecraftServerUrl = this.servers.get(message.guild.id).url;
    return this.getServerStatus(minecraftServerUrl)
      .then((response) => this.generateServerEmbed(response))
      .catch(() => this.generateServerEmbed(null));
  }

  private handleSetCommand(message: Message): Promise<MessageType> {
    const embed = new MessageEmbed();
    embed.setTitle(embedTitle);

    const bits = message.content.toUpperCase().split(' ');
    if (bits.length === 1) {
      embed.setColor(embedErrorColor);
      embed.setDescription('Usage: `+mcset my.server.address`');
      embed.addField(
        'Description',
        'Associates a Minecraft server with this Discord server'
      );
      return Promise.resolve(embed);
    }

    const serverUrl = bits[1].toLowerCase();
    const details: ServerInformation = {
      url: serverUrl,
      channelId: null,
      lastKnownOnline: false
    };
    this.servers.set(message.guild.id, details);
    const name = message.guild.name;
    embed.setColor(embedSuccessColor);
    embed.setDescription(linkServerCopy);
    embed.addField('Link information', `${name} 🔗 ${serverUrl}`);

    this.saveServers();
    return Promise.resolve(embed);
  }

  private handleAnnounceCommand(message: Message): Promise<MessageType> {
    const embed = new MessageEmbed();
    embed.setTitle(embedTitle);

    if (!this.servers.has(message.guild.id)) {
      embed.setDescription(noAssociationCopy);
      embed.setColor(embedErrorColor);
      return Promise.resolve(embed);
    }

    const serverInfo = this.servers.get(message.guild.id);
    const textChannel = message.channel as TextChannel;
    serverInfo.channelId = textChannel.id;

    embed.setColor(embedSuccessColor);
    embed.setDescription(
      `Announcing ${serverInfo.url} updates to ${textChannel.name}`
    );

    this.saveServers();
    return Promise.resolve(embed);
  }

  private fetchStatus(serverDetails: ServerInformation): void {
    this.getServerStatus(serverDetails.url).then((status) => {
      const isOnline = status !== null;
      if (serverDetails.lastKnownOnline === isOnline) {
        return;
      }

      serverDetails.lastKnownOnline = isOnline;

      // Control posting to channel
      if (!serverDetails.channelId) {
        return;
      }

      const channel = this.dependencies.client.findChannelById(
        serverDetails.channelId
      ) as TextChannel;

      if (!channel || channel === null) {
        return;
      }

      const embed = this.generateServerEmbed(status);
      channel.send(embed);
    });
  }

  private getServerStatus(url: string): Promise<ServerResponse> {
    return util
      .status(url)
      .then((response: ServerResponse) => {
        // Handle Aternos servers
        if (response && response.version.match(/\d+\.\d+\.\d+/g) === null) {
          return null;
        }

        return response;
      })
      .catch(
        (error: Error): ServerResponse => {
          this.dependencies.logger.error('Server unreachable:', error);
          return null;
        }
      );
  }

  private generateServerEmbed(status: ServerResponse): MessageEmbed {
    const isOnline = status !== null;
    const embed = new MessageEmbed();
    embed.setTitle(embedTitle);
    embed.setColor(isOnline ? embedSuccessColor : embedErrorColor);
    embed.setDescription(`Your server is ${isOnline ? 'online' : 'offline'}`);

    if (isOnline && status.onlinePlayers && status.onlinePlayers > 0) {
      // Sample players is occasionally not populated
      const players = (status.samplePlayers || []).map((p) => p.name);
      embed.addField('Status', `Players online:\n${players.join('\n')}`);
    }

    return embed;
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

    fs.writeFile(
      defaultSettingsFile,
      JSON.stringify(settingsObj),
      settingsFileEnc,
      (err) => {
        if (err) {
          return this.dependencies.logger.error(err);
        }
      }
    );
  }
}
