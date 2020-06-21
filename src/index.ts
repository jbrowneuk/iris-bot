import { DiscordClient } from './client/discord-client';
import { BotEngine } from './engine/bot-engine';
import { SettingsManager } from './engine/settings-manager';
import { SqliteWrapper } from './engine/sqlite-wrapper';
import { DependencyContainer } from './interfaces/dependency-container';
import { BasicIntelligence } from './personality/basic-intelligence';
import { GameElements } from './personality/game-elements';
import { HugBot } from './personality/hug-bot';
import { ResponseGeneratorImpl } from './personality/response-generator-impl';

// Initialise foundation
const logger = console;
const database = new SqliteWrapper();
database.connect().then(() => {
  logger.log('Database connected');
});

process.on('beforeExit', () => {
  logger.log('Disconnecting database');
  database.disconnect();
});

// Initialise bot core
const client = new DiscordClient();
const responses = new ResponseGeneratorImpl(database);
const settings = new SettingsManager();
const engine = new BotEngine(client, responses, settings);

// Construct dependency container
const dependencies: DependencyContainer = {
  client,
  database,
  engine,
  logger,
  responses,
  settings
};

// Initialise personality
engine.addPersonality(new BasicIntelligence());
engine.addPersonality(new GameElements());
engine.addPersonality(new HugBot());

// Start bot
engine.initialise();
engine.run();
