import { MessageEmbed } from 'discord.js';

import { announceCommand, setCommand, statusCommand } from '../constants/mc-server';
import { ServerResponse } from '../interfaces/mc-server';

const embedTitle = 'Server info';
const embedErrorColor = 0xff8000;
const embedSuccessColor = 0x0080ff;

// Response texts
export const noAssociationCopy =
  'No Minecraft server associated with this Discord';
export const linkServerCopy = 'Linked the server to this Discord.';

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
  embed.addField(
    `Command: ${setCommand} <url>`,
    'Associates a Minecraft server with this Discord server.',
    false
  );
  embed.addField(
    `Command: ${statusCommand}`,
    'Checks the status of the associated Minecraft server.',
    false
  );
  embed.addField(
    `Command: ${announceCommand}`,
    'Makes the bot announce status changes of the associated Minecraft server to this channel.',
    false
  );

  return embed;
}

/**
 * Generates a message embed containing a summary of the server's status
 *
 * @param url the server url
 * @param status the updated server status
 * @returns a MessageEmbed containing a summary of the server status
 */
export function generateServerEmbed(
  url: string,
  status: ServerResponse
): MessageEmbed {
  const isOnline = status !== null;

  const embed = new MessageEmbed();
  embed.setTitle(`Server: ${url}`);
  embed.setColor(isOnline ? embedSuccessColor : embedErrorColor);

  const statusText = `Status: **${isOnline ? 'online' : 'offline'}**`;
  const versionText =
    status && status.version ? `\nRunning: **${status.version}**` : '';
  embed.setDescription(`${statusText}${versionText}`);

  if (isOnline && status.onlinePlayers && status.onlinePlayers > 0) {
    // Sample players is occasionally not populated
    const players = (status.samplePlayers || []).map((p) => p.name);
    embed.addField(`Players (${status.onlinePlayers})`, players.join('\n'));
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
export function generateSetSuccessEmbed(
  guildName: string,
  serverUrl: string
): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setColor(embedSuccessColor);
  embed.setDescription(linkServerCopy);
  embed.addField('Link information', `${guildName} 🔗 ${serverUrl}`);
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
  embed.addField(
    'Description',
    'Associates a Minecraft server with this Discord server'
  );

  return embed;
}

export function generateAnnounceNoAssociationEmbed(): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setDescription(noAssociationCopy);
  embed.setColor(embedErrorColor);
  return embed;
}

export function generateAnnounceSuccessEmbed(
  serverUrl: string,
  channelName: string
): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(embedTitle);
  embed.setColor(embedSuccessColor);
  embed.setDescription(`Announcing ${serverUrl} updates to ${channelName}`);
  return embed;
}
