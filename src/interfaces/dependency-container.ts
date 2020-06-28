import { Client } from './client';
import { Database } from './database';
import { Engine } from './engine';
import { Logger } from './logger';
import { ResponseGenerator } from './response-generator';
import { Settings } from './settings';

/** Dependency container bucket for easy access to bot core */
export interface DependencyContainer {
  /** Chat system client wrapper */
  client: Client;

  /** Database engine wrapper */
  database: Database;

  /** Bot engine */
  engine: Engine;

  /**
   * Logger
   */
  logger: Logger;

  /** Response generator */
  responses: ResponseGenerator;

  /** Settings wrapper */
  settings: Settings;
}
