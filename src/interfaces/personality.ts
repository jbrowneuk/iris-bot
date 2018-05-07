import * as discord from 'discord.js';

export interface Personality {
  onAddressed(message: discord.Message): Promise<string>;
  onMessage(message: discord.Message): Promise<string>;
}
