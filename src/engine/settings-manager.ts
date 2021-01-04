import * as fs from 'fs';

import { Settings } from '../interfaces/settings';

const defaultPath = './config.json';

export class SettingsManager implements Settings {
  private settingsData: { [key: string]: any };

  /**
   * Initialises an instance of the SettingsManager class, loading from file if
   * a path is specified.
   *
   * @param path the path to the config file. Pass null to not load anything
   */
  constructor(path: string = defaultPath) {
    this.settingsData = {};
    if (path === null) {
      return;
    }

    this.initialiseFromFile(path);
  }

  public getSettings(): { [key: string]: any } {
    return this.settingsData;
  }

  public getSettingsForKey<T>(key: string): T {
    return this.settingsData[key] || null;
  }

  private initialiseFromFile(path: string): void {
    const raw = fs.readFileSync(path, { encoding: 'utf8' });
    this.settingsData = JSON.parse(raw);
  }
}
