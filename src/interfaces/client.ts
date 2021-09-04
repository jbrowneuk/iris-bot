import { Channel, PresenceData, User } from 'discord.js';
import { EventEmitter } from 'events';

import { MessageType } from '../types';

export interface Client extends EventEmitter {
  /**
   * Connects to Discord server with a given token
   *
   * @param token the connection token
   */
  connect(token: string): void;

  /** Disconnects from the server */
  disconnect(): void;

  /**
   * Returns a value signifying whether the client is connected
   *
   * @returns (boolean) true if connected
   */
  isConnected(): boolean;

  /**
   * Attempts to find a channel by a given channel ID
   *
   * @param channelId the channel ID to use in the lookup
   * @returns (Channel) the channel if found, null otherwise
   */
  findChannelById(channelId: string): Channel;

  /**
   * Gets the client's user information
   */
  getUserInformation(): User;

  /**
   * Queues a set of messages to send to the server, using the channel of the
   * last received message
   *
   * @param messages messages to queue
   */
  queueMessages(messages: MessageType[]): void;

  /**
   * Sets the client's presence and activity data
   *
   * @param data presence information to set
   */
  setPresence(data: PresenceData): void;
}
