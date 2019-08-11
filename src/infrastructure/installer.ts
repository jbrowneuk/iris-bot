import { Container } from 'inversify';

import { DiscordClient } from '../client/discord-client';
import { TYPES } from '../constants/types';
import { BotEngine } from '../engine/bot-engine';
import { SettingsManager } from '../engine/settings-manager';
import { SqliteWrapper } from '../engine/sqlite-wrapper';
import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { Engine } from '../interfaces/engine';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { ResponseGeneratorImpl } from '../personality/response-generator-impl';

export const container = new Container();
container.bind<Client>(TYPES.Client).to(DiscordClient).inSingletonScope();
container.bind<Engine>(TYPES.Engine).to(BotEngine).inSingletonScope();
container.bind<Database>(TYPES.Database).to(SqliteWrapper).inSingletonScope();
container.bind<ResponseGenerator>(TYPES.ResponseGenerator)
  .to(ResponseGeneratorImpl)
  .inSingletonScope();
container.bind<Settings>(TYPES.Settings).to(SettingsManager).inSingletonScope();
