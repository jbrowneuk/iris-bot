import { Logger } from '../interfaces/logger';

export class LoggerImpl implements Logger {
  private impl: Console;

  constructor(overrideImpl?: Console) {
    this.impl = overrideImpl || console;
  }

  public error(message: any, ...optionalParams: any[]): void {
    this.impl.error(message, optionalParams);
  }

  public log(message: any, ...optionalParams: any[]): void {
    this.impl.log(message, optionalParams);
  }
}
