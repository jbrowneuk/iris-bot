export interface Settings {
  /**
   * Gets the raw settings representation
   */
  getSettings(): { [key: string]: any };

  /**
   * Gets a setting by its key
   */
  getSettingsForKey<T>(key: string): T;
}
