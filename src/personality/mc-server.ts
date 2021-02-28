import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

import util = require('minecraft-server-util');

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
export const noAssociationCopy =
  'No Minecraft server associated with this Discord';

// Commands
export const statusCommand = '+MCSTATUS';
export const setCommand = '+MCSET';
export const announceCommand = '+MCANNOUNCE';

export class McServer implements Personality {
  protected servers: Map<string, ServerInformation>;
  protected timerInterval: number | NodeJS.Timer;

  constructor() {
    this.servers = new Map<string, ServerInformation>();
  }

  public onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<MessageType> {
    const messageText = message.content.toUpperCase();
    const discordServerId = message.guild.id;
    const embed = new MessageEmbed();
    embed.setTitle(embedTitle);

    if (messageText === statusCommand) {
      if (!this.servers.has(discordServerId)) {
        embed.setDescription(noAssociationCopy);
        embed.setColor(embedErrorColor);
        return Promise.resolve(embed);
      }

      const minecraftServerUrl = this.servers.get(discordServerId).url;
      return this.getServerStatus(minecraftServerUrl)
        .then((response) => {
          const serverStatus = this.generateServerEmbed(response);
          return serverStatus;
        })
        .catch(() => {
          const serverStatus = this.generateServerEmbed(null);
          return serverStatus;
        });
    }

    if (messageText.startsWith(setCommand)) {
      const bits = messageText.split(' ');
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
      this.servers.set(discordServerId, details);
      const name = message.guild.name;
      embed.setColor(embedSuccessColor);
      embed.setDescription('Saved the server to this Discord.');
      embed.addField('Settings', `${name} 🔗 ${serverUrl}`);

      // TODO: need to save here if we want to persist
      return Promise.resolve(embed);
    }

    if (messageText === announceCommand) {
      if (!this.servers.has(discordServerId)) {
        embed.setDescription(noAssociationCopy);
        embed.setColor(embedErrorColor);
        return Promise.resolve(embed);
      }

      const serverInfo = this.servers.get(discordServerId);
      const textChannel = message.channel as TextChannel;
      serverInfo.channelId = textChannel.id;

      embed.setColor(embedSuccessColor);
      embed.setDescription(
        `Announcing ${serverInfo.url} updates to ${textChannel.name}`
      );

      return Promise.resolve(embed);
    }

    return Promise.resolve(null);
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve(null);
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
          console.error('Server unreachable:', error);
          return null;
        }
      );
  }

  private generateServerEmbed(status: ServerResponse): MessageEmbed {
    const isOnline = status && status !== null;
    const embed = new MessageEmbed();
    embed.setTitle(embedTitle);
    embed.setColor(isOnline ? embedSuccessColor : embedErrorColor);
    embed.setDescription(`Your server is ${isOnline ? 'online' : 'offline'}`);

    if (isOnline) {
      const players = status.samplePlayers.map((p) => p.name);
      const playerCount = `${status.onlinePlayers}/${status.maxPlayers} players`;
      embed.addField('Status', `${playerCount}:\n${players.join('\n')}`);
    }

    return embed;
  }
}
