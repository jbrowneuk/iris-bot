import { DiscordClient } from './client/discord-client';
import { BotEngine } from './engine/bot-engine';
import { LoggerImpl } from './engine/logger-impl';
import { MoodEngineImpl } from './engine/mood-engine-impl';
import { SettingsManager } from './engine/settings-manager';
import { SqliteWrapper } from './engine/sqlite-wrapper';
import { DependencyContainer } from './interfaces/dependency-container';
import { BasicIntelligence } from './personality/basic-intelligence';
import { BlogRoll } from './personality/blog-roll';
import { GameElements } from './personality/game-elements';
import { HugBot } from './personality/hug-bot';
import { MoodControl } from './personality/mood-control';
import { ResponseGeneratorImpl } from './personality/response-generator-impl';
import { SimpleInteractions } from './personality/simple-interactions';

// Initialise foundation
const logger = new LoggerImpl();
const database = new SqliteWrapper();
database.connect().then(() => {
  logger.log('Database connected');
});

// Set up process exit handler
function destroyHandler(): void {
  logger.log('Destroy handler called');
  engine.destroy();
  database.disconnect();
}

process.on('beforeExit', destroyHandler);
process.on('SIGINT', destroyHandler);

// Initialise bot core
const client = new DiscordClient(logger);
const moodEngine = new MoodEngineImpl();
const responses = new ResponseGeneratorImpl(database, logger, moodEngine);
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
engine.addPersonality(new GameElements(dependencies));
engine.addPersonality(new HugBot());
engine.addPersonality(new BlogRoll(dependencies));
engine.addPersonality(new MoodControl(dependencies, moodEngine));
engine.addPersonality(new SimpleInteractions(dependencies));

// Start bot
engine.initialise();
engine.run();
