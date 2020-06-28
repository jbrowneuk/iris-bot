export interface Logger {
  /**
   * Logs an error to the output
   *
   * @param message Message to log
   * @param optionalParams Optional parameters for the log message
   */
  error(message: any, ...optionalParams: any[]): void;

  /**
   * Logs a message to the output
   *
   * @param message Message to log
   * @param optionalParams Optional parameters for the log message
   */
  log(message: any, ...optionalParams: any[]): void;
}
