export interface ResponseGenerator {
  generateResponse(phrase: string): Promise<string>;
}
