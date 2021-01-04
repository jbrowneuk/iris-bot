import { SettingsManager } from './settings-manager';

describe('Simple settings manager', () => {
  it('should construct with blank settings if null path provided', () => {
    const testObject = new SettingsManager(null);
    expect(testObject).toBeTruthy();
    expect(testObject.getSettings()).toEqual({});
  });

  it('should load configuration if path provided in constructor', () => {
    const testObject = new SettingsManager('./config.example.json');
    expect(testObject.getSettings()).toBeTruthy();
    expect(testObject.getSettingsForKey('token')).toBeTruthy();
  });

  it('should return settings', () => {
    const fakeSettings = { setting: 'value' };

    const testObject = new SettingsManager(null);
    (testObject as any).settingsData = fakeSettings;

    expect(testObject.getSettings()).toEqual(fakeSettings);
  });

  it('should return value for setting when key provided', () => {
    const fakeSettings = { key1: 'value', key2: { number: 1 }};

    const testObject = new SettingsManager(null);
    (testObject as any).settingsData = fakeSettings;

    expect(testObject.getSettingsForKey('key1')).toBe(fakeSettings.key1);
    expect(testObject.getSettingsForKey('key2')).toEqual(fakeSettings.key2);
  });
});
