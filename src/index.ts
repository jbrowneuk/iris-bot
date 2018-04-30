import 'reflect-metadata';

import { container } from './infrastructure/installer';
import { TYPES } from './constants/types';
import { Engine } from './interfaces/engine';

const botEngine = container.get<Engine>(TYPES.Engine);
botEngine.run();
