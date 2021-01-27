export interface Settings {
  /**
   * Gets the raw settings representation
   */
  getSettings(): { [key: string]: any };

  /**
   * Gets a setting by its key
   *
   * @param key the key to get values for
   */
  getSettingsForKey<T>(key: string): T;

  /**
   * Sets a setting by key
   *
   * @param key the key to set value for
   * @param value the value to set
   */
  setValueForKey<T>(key: string, value: T): void;
}
