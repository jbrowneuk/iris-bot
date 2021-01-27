import * as fs from 'fs';

import { Settings } from '../interfaces/settings';

const defaultPath = './config.json';
const encoding = 'utf8';

export class SettingsManager implements Settings {
  protected settingsData: { [key: string]: any };

  /**
   * Initialises an instance of the SettingsManager class, loading from file if
   * a path is specified.
   *
   * @param path the path to the config file. Pass null to not load anything
   */
  constructor(protected path: string = defaultPath) {
    this.settingsData = {};
    if (path === null) {
      return;
    }

    this.initialiseFromFile();
  }

  public getSettings(): { [key: string]: any } {
    return this.settingsData;
  }

  public getSettingsForKey<T>(key: string): T {
    return this.settingsData[key] || null;
  }

  setValueForKey<T>(key: string, value: T): void {
    this.settingsData[key] = value;
    this.saveToFile();
  }

  private initialiseFromFile(): void {
    const raw = fs.readFileSync(this.path, { encoding });
    this.settingsData = JSON.parse(raw);
  }

  private saveToFile(): void {
    fs.writeFile(
      this.path,
      JSON.stringify(this.settingsData),
      encoding,
      (err) => {
        err && console.error(err);
      }
    );
  }
}
