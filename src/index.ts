import * as nodeCleanup from 'node-cleanup';

import { DiscordClient } from './client/discord-client';
import { BotEngine } from './engine/bot-engine';
import { LoggerImpl } from './engine/logger-impl';
import { MoodEngineImpl } from './engine/mood-engine-impl';
import { ResponseGeneratorImpl } from './engine/response-generator-impl';
import { SettingsManager } from './engine/settings-manager';
import { SqliteWrapper } from './engine/sqlite-wrapper';
import { DependencyContainer } from './interfaces/dependency-container';
import { AnimalImages } from './personality/animal-images';
import { BasicIntelligence } from './personality/basic-intelligence';
import { BlogRoll } from './personality/blog-roll';
import { BuildInfo } from './personality/build-info';
import { CallResponse } from './personality/call-response';
import { DieRoll } from './personality/die-roll';
import { HangmanGame } from './personality/hangman-game';
import { HugBot } from './personality/hug-bot';
import { McServer } from './personality/mc-server';
import { MoodControl } from './personality/mood-control';
import { SimpleInteractions } from './personality/simple-interactions';
import { Stickers } from './personality/stickers';

// Initialise foundation
const logger = new LoggerImpl();
const database = new SqliteWrapper(logger);
database.connect().then(() => {
  logger.log('Database connected');
});

// Set up process exit handler
function destroyHandler(): void {
  logger.log('Destroy handler called');
  engine.destroy();
  database.disconnect();
}

nodeCleanup(destroyHandler);

// Initialise bot core
const client = new DiscordClient(logger);
const moodEngine = new MoodEngineImpl();
const responses = new ResponseGeneratorImpl(database, logger, moodEngine);
const settings = new SettingsManager(logger);
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
engine.addPersonality(new AnimalImages(dependencies));
engine.addPersonality(new BasicIntelligence());
engine.addPersonality(new BlogRoll(dependencies));
engine.addPersonality(new BuildInfo());
engine.addPersonality(new CallResponse(dependencies));
engine.addPersonality(new DieRoll(dependencies));
engine.addPersonality(new HangmanGame(dependencies));
engine.addPersonality(new HugBot());
engine.addPersonality(new McServer(dependencies));
engine.addPersonality(new MoodControl(dependencies, moodEngine));
engine.addPersonality(new SimpleInteractions(dependencies));
engine.addPersonality(new Stickers(dependencies));

// Start bot
engine.initialise();
engine.run();
