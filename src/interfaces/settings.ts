export interface Settings {
  /**
   * Gets the raw settings representation
   */
  getSettings(): { [key: string]: any };
}
