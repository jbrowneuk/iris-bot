import 'reflect-metadata';

import { container } from './infrastructure/installer';
import { TYPES } from './constants/types';
import { Engine } from './interfaces/engine';

import { BasicIntelligence } from './personality/basic-intelligence';
import { GameElements } from './personality/game-elements';
import { HugBot } from './personality/hug-bot';

const botEngine = container.get<Engine>(TYPES.Engine);

// TODO: dep injection
botEngine.addPersonality(new BasicIntelligence());
botEngine.addPersonality(new GameElements());
botEngine.addPersonality(new HugBot());

botEngine.run();
