import { DiscordClient } from './client/discord-client';
import { BotEngine } from './engine/bot-engine';
import { SettingsManager } from './engine/settings-manager';
import { SqliteWrapper } from './engine/sqlite-wrapper';
import { BasicIntelligence } from './personality/basic-intelligence';
import { GameElements } from './personality/game-elements';
import { HugBot } from './personality/hug-bot';
import { ResponseGeneratorImpl } from './personality/response-generator-impl';

const db = new SqliteWrapper();
db.connect().then(() => {
  console.log('Database connected');
});

const client = new DiscordClient();
const responseGen = new ResponseGeneratorImpl(db);
const settings = new SettingsManager();
const botEngine = new BotEngine(client, responseGen, settings);

// TODO: dep injection
botEngine.addPersonality(new BasicIntelligence());
botEngine.addPersonality(new GameElements());
botEngine.addPersonality(new HugBot());

botEngine.run();

process.on('beforeExit', () => {
  console.log('Disconnecting database');
  db.disconnect();
});
