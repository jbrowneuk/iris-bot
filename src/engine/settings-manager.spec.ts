import { SettingsManager } from './settings-manager';

describe('Simple settings manager', () => {
  it('should construct', () => {
    const testObject = new SettingsManager('./config.example.json');
    expect(testObject).toBeTruthy();
  });

  it('should return settings', () => {
    const fakeSettings = { setting: 'value' };

    const testObject = new SettingsManager('./config.example.json');
    (testObject as any).settingsData = fakeSettings;

    expect(testObject.getSettings()).toEqual(fakeSettings);
  });
});
