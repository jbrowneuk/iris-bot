import { DiscordClient } from './client/discord-client';
import { BotEngine } from './engine/bot-engine';
import { LoggerImpl } from './engine/logger-impl';
import { SettingsManager } from './engine/settings-manager';
import { SqliteWrapper } from './engine/sqlite-wrapper';
import { DependencyContainer } from './interfaces/dependency-container';
import { BasicIntelligence } from './personality/basic-intelligence';
import { BlogRoll } from './personality/blog-roll';
import { GameElements } from './personality/game-elements';
import { HugBot } from './personality/hug-bot';
import { ResponseGeneratorImpl } from './personality/response-generator-impl';

// Initialise foundation
const logger = new LoggerImpl();
const database = new SqliteWrapper();
database.connect().then(() => {
  logger.log('Database connected');
});

// Set up process exit handler
function destroyHandler(): void {
  logger.log('Disconnecting database');
  engine.destroy();
  database.disconnect();
}

process.on('beforeExit', destroyHandler);
process.on('SIGINT', destroyHandler);

// Initialise bot core
const client = new DiscordClient(logger);
const responses = new ResponseGeneratorImpl(database, logger);
const settings = new SettingsManager();
const engine = new BotEngine(client, responses, settings, logger);

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
engine.addPersonality(new BlogRoll(dependencies));

// Start bot
engine.initialise();
engine.run();
