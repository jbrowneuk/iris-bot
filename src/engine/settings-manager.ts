import * as fs from 'fs';
import { injectable, optional } from 'inversify';

import { Settings } from '../interfaces/settings';

const defaultPath = './config.json';

@injectable()
export class SettingsManager implements Settings {

  private settingsData: { [key: string]: any };

  constructor(@optional() path: string = defaultPath) {
    this.settingsData = {};

    this.initialiseFromFile(path);
  }

  public getSettings(): { [key: string]: any } {
    return this.settingsData;
  }

  private initialiseFromFile(path: string): void {
    const raw = fs.readFileSync(path, { encoding: 'utf8' });
    this.settingsData = JSON.parse(raw);
  }

}
