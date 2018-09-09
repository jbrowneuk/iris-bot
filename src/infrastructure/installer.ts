import { Container } from 'inversify';

import { TYPES } from '../constants/types';
import { Client } from '../interfaces/client';
import { DiscordClient } from '../client/discord-client';
import { Engine } from '../interfaces/engine';
import { BotEngine } from '../engine/bot-engine';
import { Database } from '../interfaces/database';
import { SqliteWrapper } from '../engine/sqlite-wrapper';
import { ResponseGenerator } from '../interfaces/response-generator';
import { ResponseGeneratorImpl } from '../personality/response-generator-impl';
import { Settings } from '../interfaces/settings';
import { SettingsManager } from '../engine/settings-manager';

export const container = new Container();
container.bind<Client>(TYPES.Client).to(DiscordClient).inSingletonScope();
container.bind<Engine>(TYPES.Engine).to(BotEngine).inSingletonScope();
container.bind<Database>(TYPES.Database).to(SqliteWrapper).inSingletonScope();
container.bind<ResponseGenerator>(TYPES.ResponseGenerator)
  .to(ResponseGeneratorImpl)
  .inSingletonScope();
container.bind<Settings>(TYPES.Settings).to(SettingsManager).inSingletonScope();
