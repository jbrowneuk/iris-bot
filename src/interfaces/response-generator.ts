export interface ResponseGenerator {
  /**
   * Selects a response from a phrase set based upon mood value
   *
   * @param phrase the phrase to look up
   */
  generateResponse(phrase: string): Promise<string>;
}
