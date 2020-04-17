import * as discord from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { Personality } from '../interfaces/personality';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { BotEngine } from './bot-engine';
import { HandledResponseError } from './handled-response-error';

const MOCK_USERNAME = 'bot';
const MOCK_ID = 'BOT12345';

describe('Bot engine', () => {
  let client: IMock<Client>;
  let responseGenerator: IMock<ResponseGenerator>;
  let settings: IMock<Settings>;

  beforeEach(() => {
    client = Mock.ofType<Client>();
    responseGenerator = Mock.ofType<ResponseGenerator>();
    responseGenerator
      .setup(m => m.generateResponse(It.isAnyString()))
      .returns((phrase: string) => Promise.resolve(phrase));
    settings = Mock.ofType<Settings>();
    settings
      .setup(s => s.getSettings())
      .returns(() => ({ token: 'bot-token' }));
  });

  it('should construct', () => {
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    expect(engine).toBeTruthy();
  });

  it('should connect on run', () => {
    client.setup(m => m.connect(It.isAnyString()));
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );

    engine.run();

    client.verify(m => m.connect(It.isAnyString()), Times.once());
  });

  it('should initialise event listeners on run', () => {
    client.setup(m => m.on(It.isAnyString(), It.isAny()));
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );

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
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'onConnected');

    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
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
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'onMessage');

    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
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
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;
    const mockCore = Mock.ofType<Personality>();

    expect(untypedEngine.personalityConstructs.length).toBe(0);

    engine.addPersonality(mockCore.object);

    expect(untypedEngine.personalityConstructs.length).toBe(1);
  });

  it('should handle ambient messages when message received', () => {
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;

    spyOn(untypedEngine, 'calculateAddressedMessage').and.returnValue(null);
    spyOn(untypedEngine, 'handleAmbientMessage');

    untypedEngine.onMessage({});

    expect(untypedEngine.handleAmbientMessage).toHaveBeenCalled();
  });

  it('should handle addressed messages when message received', () => {
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;

    spyOn(untypedEngine, 'calculateAddressedMessage').and.returnValue('test');
    spyOn(untypedEngine, 'handleAddressedMessage');

    untypedEngine.onMessage({});

    expect(untypedEngine.handleAddressedMessage).toHaveBeenCalled();
  });

  it('should send message when one is generated as a response', (done: DoneFn) => {
    const mockMessage = 'hello world';
    const fakeMessageFns = [
      Promise.resolve(mockMessage),
      Promise.resolve(null)
    ];
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;

    untypedEngine
      .dequeuePromises(fakeMessageFns)
      .catch((err: any) =>
        expect(err instanceof HandledResponseError).toBeTruthy()
      );

    setTimeout(() => {
      client.verify(
        c => c.queueMessages(It.isValue([mockMessage])),
        Times.once()
      );
      done();
    }, 100);
  });

  it('should handle an exception being thrown', (done: DoneFn) => {
    const failureMessage = 'I am a failure';
    const fakeMessageFns = [
      Promise.reject(failureMessage),
      Promise.resolve(null)
    ];
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;

    untypedEngine
      .dequeuePromises(fakeMessageFns)
      .then(() => fail('should not get here'))
      .catch((err: any) => {
        expect(err).toBe(failureMessage);
        client.verify(c => c.queueMessages(It.isAny()), Times.never());
        done();
      });
  });

  it('should queue messages from personality cores', () => {
    let queuedPromises = [];
    const mockMessage = { content: 'lol hello' };
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'dequeuePromises').and.callFake((arg: any[]) => {
      queuedPromises = arg;
      return Promise.resolve(null);
    });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore
      .setup(m => m.onMessage(It.isAny()))
      .returns(() => Promise.resolve(null));
    untypedEngine.personalityConstructs = [mockPersonalityCore.object];

    untypedEngine.handleAmbientMessage(mockMessage);

    expect(untypedEngine.dequeuePromises).toHaveBeenCalled();
    expect(queuedPromises.length).toBe(1);
  });

  it('should detect when being addressed', (done: DoneFn) => {
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;

    interface InputOutputPair {
      input: string;
      expectedOutput: string;
    }
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
      { input: `<@!${MOCK_ID}>! hi`, expectedOutput: 'hi' },
      { input: `hey <@!${MOCK_ID}>, open door`, expectedOutput: 'open door' },
      { input: `@${MOCK_USERNAME} 12345`, expectedOutput: '12345' }
    ];

    const mockUserInfo = Mock.ofType<discord.User>();
    mockUserInfo.setup(m => m.username).returns(() => MOCK_USERNAME);
    mockUserInfo.setup(m => m.id).returns(() => MOCK_ID);

    messageMappedToExpectedResults.forEach((kvp: InputOutputPair) => {
      client
        .setup(m => m.getUserInformation())
        .returns(() => mockUserInfo.object);
      const mockMessage = {
        content: kvp.input,
        guild: { members: { get: () => {} } }
      };
      const actualResult = untypedEngine.calculateAddressedMessage(mockMessage);
      expect(actualResult).toBe(kvp.expectedOutput);
    });

    done();
  });

  it('should queue addressed messages from personality cores', () => {
    let queuedPromises = [];
    const messageText = 'lol hello';
    const mockMessage = { content: `${MOCK_USERNAME} ${messageText}` };
    const engine = new BotEngine(
      client.object,
      responseGenerator.object,
      settings.object
    );
    const untypedEngine = engine as any;
    spyOn(untypedEngine, 'dequeuePromises').and.callFake((arg: any[]) => {
      queuedPromises = arg;
      return Promise.resolve(null);
    });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore
      .setup(m => m.onAddressed(It.isAny(), It.isAnyString()))
      .returns(() => Promise.resolve(null));
    untypedEngine.personalityConstructs = [mockPersonalityCore.object];

    untypedEngine.handleAddressedMessage(mockMessage, messageText);

    expect(untypedEngine.dequeuePromises).toHaveBeenCalled();
    expect(queuedPromises.length).toBe(1);
  });
});
