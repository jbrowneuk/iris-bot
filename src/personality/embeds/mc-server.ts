import { MessageEmbed } from 'discord.js';

import { announceCommand, defaultDescription, noAssociationCopy, setCommand, statusCommand } from '../constants/mc-server';
import { ServerResponse } from '../interfaces/mc-server';

const embedTitle = 'Server info';
const embedErrorColor = 0xff8000;
const embedSuccessColor = 0x0080ff;

// Response texts
export const linkServerCopy = 'Linked the server to this Discord.';

// Field titles (for test checking)
export const fieldTitleVersion = 'Version';
export const fieldTitlePlayers = 'Players';

/**
 * Generates a message embed containing the help for the plugin
 *
 * @returns a MessageEmbed containing help text
 */
export function generateHelpEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setColor(embedSuccessColor);
  embed.setTitle('Minecraft Server Plugin');
  embed.setDescription('Allows you to check the status of a Minecraft server.');
  embed.addFields([
    { name: `Command: ${setCommand} <url>`, value: 'Associates a Minecraft server with this Discord server.', inline: false },
    { name: `Command: ${statusCommand}`, value: 'Checks the status of the associated Minecraft server.', inline: false },
    { name: `Command: ${announceCommand}`, value: 'Makes the bot announce status changes of the associated Minecraft server to this channel.', inline: false }
  ]);

  return embed;
}

/**
 * Generates a message embed containing a summary of the server's status
 *
 * @param url the server url
 * @param status the updated server status
 * @returns a MessageEmbed containing a summary of the server status
 */
export function generateServerEmbed(url: string, status: ServerResponse | null): MessageEmbed {
  const isOnline = status !== null && status.online;
  const description = status?.motd?.clean || defaultDescription;
  const statusText = isOnline ? 'online' : 'offline';

  const embed = new MessageEmbed();
  embed.setTitle(`${url} is ${statusText}`);
  embed.setDescription(description);
  embed.setColor(isOnline ? embedSuccessColor : embedErrorColor);

  // Version field
  if (status && status.version && status.version.name_clean) {
    const fieldData = { name: fieldTitleVersion, value: status.version.name_clean };
    embed.addFields([fieldData]);
  }

  if (isOnline && status.players && status.players.online > 0) {
    // Sample players is occasionally not populated
    const players = (status.players.list || []).map(p => p.name_clean);
    const fieldData = { name: `${fieldTitlePlayers} (${status.players.online})`, value: players.join('\n') };
    embed.addFields([fieldData]);
  }

  return embed;
}

/**
 * Generates a message embed containing a message that a server has not been
 * linked to a discord guild
 *
 * @returns a MessageEmbed containing an error
 */
export function generateStatusFailureEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setDescription(noAssociationCopy);
  embed.setColor(embedErrorColor);
  return embed;
}

/**
 * Generates a message embed containing a message summarising a successful link
 * of a server to a discord guild
 *
 * @returns a MessageEmbed containing a summary of the link
 */
export function generateSetSuccessEmbed(guildName: string, serverUrl: string): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setColor(embedSuccessColor);
  embed.setDescription(linkServerCopy);
  embed.addFields([{ name: 'Link information', value: `${guildName} 🔗 ${serverUrl}` }]);
  return embed;
}

/**
 * Generates a message embed containing a message that a server has not been
 * linked to a discord guild
 *
 * @returns a MessageEmbed containing an error
 */
export function generateSetFailureEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);

  embed.setColor(embedErrorColor);
  embed.setDescription(`Usage: \`${setCommand} my.server.address\``);
  embed.addFields([{ name: 'Description', value: 'Associates a Minecraft server with this Discord server' }]);

  return embed;
}

export function generateAnnounceNoAssociationEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setDescription(noAssociationCopy);
  embed.setColor(embedErrorColor);
  return embed;
}

export function generateAnnounceSuccessEmbed(serverUrl: string, channelName: string): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setColor(embedSuccessColor);
  embed.setDescription(`Announcing ${serverUrl} updates to ${channelName}`);
  return embed;
}
