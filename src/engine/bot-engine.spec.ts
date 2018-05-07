import { BotEngine } from './bot-engine';
import { IMock, Mock, It, Times } from 'typemoq';
import { Client } from '../interfaces/client';
import * as LifecycleEvents from '../constants/lifecycle-events';

describe('Bot engine', () => {
  let client: IMock<Client>;

  beforeEach(() => {
    client = Mock.ofType<Client>();
  });

  it('should construct', () => {
    const engine = new BotEngine(client.object);
    expect(engine).toBeTruthy();
  });

  it('should connect on run', () => {
    client.setup(m => m.connect(It.isAnyString()));
    const engine = new BotEngine(client.object);

    engine.run();

    client.verify(m => m.connect(It.isAnyString()), Times.once());
  });

  it('should initialise event listeners on run', () => {
    client.setup(m => m.on(It.isAnyString(), It.isAny()));
    const engine = new BotEngine(client.object);

    engine.run();

    // Connected and message
    client.verify(
      m => m.on(It.isValue(LifecycleEvents.CONNECTED), It.isAny()),
      Times.once()
    );
    client.verify(
      m => m.on(It.isValue(LifecycleEvents.MESSAGE), It.isAny()),
      Times.once()
    );
  });

  it('should add connection event handler on connection', () => {
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'onConnected');

    const callbacks: { evt: string; cb: Function }[] = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: Function) => {
        callbacks.push({ evt, cb });
      });

    engine.run();

    const relatedHandler = callbacks.find(
      cb => cb.evt === LifecycleEvents.CONNECTED
    );
    relatedHandler.cb.call(client);

    expect(untypedEngine.onConnected).toHaveBeenCalled();
  });

  it('should add connection event handler on connection', () => {
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'onMessage');

    const callbacks: { evt: string; cb: Function }[] = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: Function) => {
        callbacks.push({ evt, cb });
      });

    engine.run();

    const relatedHandler = callbacks.find(
      cb => cb.evt === LifecycleEvents.MESSAGE
    );
    relatedHandler.cb.call(client);

    expect(untypedEngine.onMessage).toHaveBeenCalled();
  });
});
