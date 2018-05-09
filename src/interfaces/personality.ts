import * as discord from 'discord.js';

export interface Personality {
  onAddressed(message: discord.Message, addressedMessage: string): Promise<string>;
  onMessage(message: discord.Message): Promise<string>;
}
