import { IMock, It, Mock, Times } from 'typemoq';

import { Logger } from '../interfaces/logger';
import { LoggerImpl } from './logger-impl';

describe('Logger implementation', () => {
  let mockConsole: IMock<Console>;
  let logger: Logger;

  beforeEach(() => {
    mockConsole = Mock.ofType<Console>();
    logger = new LoggerImpl(mockConsole.object);
  });

  it('should pass error to underlying implementation', () => {
    const message = 'err';
    const params = { prop: true };

    logger.error(message, params);

    mockConsole.verify(c => c.error(It.isValue(message), It.isValue(params)), Times.once());
  });

  it('should pass log to underlying implementation', () => {
    const message = 'log';
    const params = { prop: true };

    logger.log(message, params);

    mockConsole.verify(c => c.log(It.isValue(message), It.isValue(params)), Times.once());
  });
});
