import { BotEngine } from './bot-engine';
import { IMock, Mock, It, Times } from 'typemoq';
import { Client } from '../interfaces/client';
import * as LifecycleEvents from '../constants/lifecycle-events';
import { Personality } from '../interfaces/personality';
import * as discord from 'discord.js';

const MOCK_USERNAME = 'bot';
const MOCK_ID = 'BOT12345';

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

  it('should add personality construct', () => {
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;
    const mockCore = Mock.ofType<Personality>();
    
    expect(untypedEngine.personalityConstructs.length).toBe(0);

    engine.addPersonality(mockCore.object);

    expect(untypedEngine.personalityConstructs.length).toBe(1);
  });

  it('should send message when one is generated as a response', (done: DoneFn) => {
    const mockMessage = 'hello world';
    const fakeMessageFns = [Promise.resolve(mockMessage), Promise.resolve(null)];
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;

    untypedEngine.dequeuePromises(fakeMessageFns);

    setTimeout(
      () => {
        client.verify(c => c.queueMessages(It.isValue([mockMessage])), Times.once());
        done();
      },
      100);
  });

  it('should handle an exception being thrown', (done: DoneFn) => {
    const failureMessage = 'I am a failure';
    const fakeMessageFns = [Promise.reject(failureMessage), Promise.resolve(null)];
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;
    spyOn(console, 'error');

    untypedEngine.dequeuePromises(fakeMessageFns);

    setTimeout(
      () => {
        expect(console.error).toHaveBeenCalledWith(failureMessage);
        client.verify(c => c.queueMessages(It.isAny()), Times.never());
        done();
      },
      100);
  });

  it('should queue messages from personality cores', () => {
    let queuedPromises = [];
    const mockMessage = { content: 'lol hello' };
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'dequeuePromises').and.callFake((arg: any[]) => { queuedPromises = arg; });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore.setup(m => m.onMessage(It.isAny())).returns(() => Promise.resolve(null));
    untypedEngine.personalityConstructs = [mockPersonalityCore.object];

    untypedEngine.handleAmbientMessage(mockMessage);

    expect(untypedEngine.dequeuePromises).toHaveBeenCalled();
    expect(queuedPromises.length).toBe(2); // Personality construct + default response
  });

  it('should detect when being addressed', (done: DoneFn) => {
    const engine = new BotEngine(client.object);
    const untypedEngine = engine as any;

    interface InputOutputPair { input: string; expectedOutput: string; }
    const messageMappedToExpectedResults: InputOutputPair[] = [
      { input: 'hehehe', expectedOutput: null },
      { input: 'okay', expectedOutput: null },
      { input: 'hey', expectedOutput: null },
      { input: `hey${MOCK_USERNAME}`, expectedOutput: null }, // no space before bot name
      { input: `long ${MOCK_USERNAME}: message`, expectedOutput: null },
      { input: `${MOCK_USERNAME}, hello`, expectedOutput: 'hello' },
      { input: `${MOCK_USERNAME} hello`, expectedOutput: 'hello' },
      { input: `${MOCK_USERNAME}`, expectedOutput: '' },
      { input: `${MOCK_USERNAME}:`, expectedOutput: '' },
      { input: `ok ${MOCK_USERNAME} hello`, expectedOutput: 'hello' },
      { input: `<@${MOCK_ID}>! hi`, expectedOutput: 'hi' },
      { input: `hey <@${MOCK_ID}>, open door`, expectedOutput: 'open door' }
    ];

    const mockUserInfo = Mock.ofType<discord.User>();
    mockUserInfo.setup(m => m.username).returns(() => MOCK_USERNAME);
    mockUserInfo.setup(m => m.id).returns(() => MOCK_ID);

    messageMappedToExpectedResults.forEach((kvp: InputOutputPair) => {
      client.setup(m => m.getUserInformation()).returns(() => mockUserInfo.object);
      const actualResult = untypedEngine.calculateAddressedMessage({ content: kvp.input });
      expect(actualResult).toBe(kvp.expectedOutput);
    });

    done();
  });
});
