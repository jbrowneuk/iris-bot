import * as fs from 'fs';

import { SettingsManager } from './settings-manager';

class TestableSettingsManager extends SettingsManager {
  constructor(path: string | null) {
    super(console, path);
  }

  public get FilePath(): string {
    return this.path === null ? '' : this.path;
  }

  public set FilePath(value: string) {
    this.path = value;
  }

  public mockOutSettings(mockSettings: { [key: string]: any }): void {
    this.settingsData = mockSettings;
  }
}

describe('Simple settings manager', () => {
  it('should construct with blank settings if null path provided', () => {
    const testObject = new TestableSettingsManager(null);
    expect(testObject).toBeTruthy();
    expect(testObject.getSettings()).toEqual({});
  });

  it('should load configuration if path provided in constructor', () => {
    const testObject = new TestableSettingsManager('./conf/config.example.json');
    expect(testObject.getSettings()).toBeTruthy();
    expect(testObject.getSettingsForKey('token')).toBeTruthy();
  });

  it('should return settings', () => {
    const fakeSettings = { setting: 'value' };
    const testObject = new TestableSettingsManager(null);
    testObject.mockOutSettings(fakeSettings);

    expect(testObject.getSettings()).toEqual(fakeSettings);
  });

  it('should return value for setting when key provided', () => {
    const fakeSettings = { key1: 'value', key2: { number: 1 } };
    const testObject = new TestableSettingsManager(null);
    testObject.mockOutSettings(fakeSettings);

    expect(testObject.getSettingsForKey('key1')).toBe(fakeSettings.key1);
    expect(testObject.getSettingsForKey('key2')).toEqual(fakeSettings.key2);
  });

  it('should set value for key', () => {
    const fakeSettings = { key1: 'value' };
    const testObject = new TestableSettingsManager(null);
    testObject.mockOutSettings(fakeSettings);

    // Mock saving to ensure only this unit is tested
    jest.spyOn(testObject as any, 'saveToFile').mockImplementation(() => null);

    const testKey = 'myKeyHere';
    const testValue = 'new value';
    testObject.setValueForKey(testKey, testValue);

    expect(testObject.getSettingsForKey(testKey)).toBe(testValue);
  });

  it('should save settings when value set', done => {
    const mockFilePath = 'config-test.json';
    const testObject = new TestableSettingsManager(null);
    testObject.mockOutSettings({});
    testObject.FilePath = mockFilePath;

    const testKey = 'myKeyHere';
    const testValue = 'new value';
    testObject.setValueForKey(testKey, testValue);

    setTimeout(() => {
      // Check the raw data contains the value
      const rawData = fs.readFileSync(mockFilePath, 'utf8');
      const data = JSON.parse(rawData);
      expect(data[testKey]).toBe(testValue);

      // Remove the test file
      fs.unlink(mockFilePath, () => done());
    }, 100);
  });
});
