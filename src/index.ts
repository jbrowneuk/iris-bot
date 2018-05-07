import 'reflect-metadata';

import { container } from './infrastructure/installer';
import { TYPES } from './constants/types';
import { Engine } from './interfaces/engine';

import { BasicIntelligence } from './personality/basic-intelligence';

const botEngine = container.get<Engine>(TYPES.Engine);
botEngine.addPersonality(new BasicIntelligence); // TODO: dep injection
botEngine.run();
