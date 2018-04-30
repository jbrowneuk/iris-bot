import { Container } from 'inversify';

import { TYPES } from '../constants/types';
import { Client } from '../interfaces/client';
import { DiscordClient } from '../client/discord-client';
import { Engine } from '../interfaces/engine';
import { BotEngine } from '../engine/bot-engine';

export const container = new Container();
container.bind<Client>(TYPES.Client).to(DiscordClient);
container.bind<Engine>(TYPES.Engine).to(BotEngine);
