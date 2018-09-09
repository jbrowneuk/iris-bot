import * as fs from 'fs';
import { injectable } from 'inversify';

import { Settings } from '../interfaces/settings';

const path = './config.json';

@injectable()
export class SettingsManager implements Settings {

  private settingsData: { [key: string]: any };

  constructor() {
    this.settingsData = {};
    this.initialiseFromFile();
  }

  public getSettings(): { [key: string]: any } {
    return this.settingsData;
  }

  private initialiseFromFile(): void {
    const raw = fs.readFileSync(path, { encoding: 'utf8' });
    this.settingsData = JSON.parse(raw);
  }

}
