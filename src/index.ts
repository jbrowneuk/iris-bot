import 'reflect-metadata';

import { TYPES } from './constants/types';
import { container } from './infrastructure/installer';
import { Engine } from './interfaces/engine';

import { Database } from './interfaces/database';
import { BasicIntelligence } from './personality/basic-intelligence';
import { GameElements } from './personality/game-elements';
import { HugBot } from './personality/hug-bot';

const botEngine = container.get<Engine>(TYPES.Engine);
const db = container.get<Database>(TYPES.Database);
db.connect().then(() => {
  console.log('Database connected');
});

// TODO: dep injection
botEngine.addPersonality(new BasicIntelligence());
botEngine.addPersonality(new GameElements());
botEngine.addPersonality(new HugBot());

botEngine.run();

process.on('beforeExit', () => {
  console.log('Disconnecting database');
  db.disconnect();
});
