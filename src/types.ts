import { MessageEmbed, MessageOptions } from 'discord.js';

/** All-encapsulating type to enable sending of messages to a Text Channel  */
export type MessageType = string | MessageEmbed | MessageOptions | null;
