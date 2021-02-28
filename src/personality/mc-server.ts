import { Message, MessageEmbed } from 'discord.js';

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

// Commands
export const statusCommand = '+MCSTATUS';

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
        embed.setDescription(
          'No Minecraft server associated with this Discord'
        );
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
        if (response.version.match(/\d+\.\d+\.\d+/g) === null) {
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
