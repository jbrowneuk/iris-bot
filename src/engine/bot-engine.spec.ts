import { Guild, Message, MessageEmbed, User } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { Personality } from '../interfaces/personality';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { MessageType } from '../types';
import { BotEngine, helpCommands, helpResponseText } from './bot-engine';
import { HandledResponseError } from './handled-response-error';

const MOCK_USERNAME = 'bot';
const MOCK_ID = 'BOT12345';

describe('Bot engine', () => {
  let client: IMock<Client>;
  let responseGenerator: IMock<ResponseGenerator>;
  let settings: IMock<Settings>;
  let mockUserInfo: IMock<User>;

  let engine: BotEngine;
  let untypedEngine: any;

  beforeEach(() => {
    mockUserInfo = Mock.ofType<User>();
    mockUserInfo.setup(m => m.username).returns(() => MOCK_USERNAME);
    mockUserInfo.setup(m => m.id).returns(() => MOCK_ID);

    client = Mock.ofType<Client>();
    client.setup(c => c.getUserInformation()).returns(() => mockUserInfo.object);

    responseGenerator = Mock.ofType<ResponseGenerator>();
    responseGenerator.setup(m => m.generateResponse(It.isAnyString())).returns((phrase: string) => Promise.resolve(phrase));
    settings = Mock.ofType<Settings>();
    settings.setup(s => s.getSettings()).returns(() => ({ token: 'bot-token' }));

    engine = new BotEngine(client.object, responseGenerator.object, settings.object, console);
    untypedEngine = engine;
  });

  it('should construct', () => {
    expect(engine).toBeTruthy();
  });

  it('should connect on run', () => {
    client.setup(m => m.connect(It.isAnyString()));

    engine.run();

    client.verify(m => m.connect(It.isAnyString()), Times.once());
  });

  it('should initialise event listeners on run', () => {
    client.setup(m => m.on(It.isAnyString(), It.isAny()));

    engine.run();

    // Connected and message
    client.verify(m => m.on(It.isValue(LifecycleEvents.CONNECTED), It.isAny()), Times.once());
    client.verify(m => m.on(It.isValue(LifecycleEvents.MESSAGE), It.isAny()), Times.once());
  });

  it('should add connection event handler on connection', () => {
    jest.spyOn(untypedEngine, 'onConnected').mockImplementation(() => {});

    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });

    engine.run();

    const relatedHandler = callbacks.find(cb => cb.evt === LifecycleEvents.CONNECTED);
    relatedHandler?.cb.call(client);

    expect(untypedEngine.onConnected).toHaveBeenCalled();
  });

  it('should add connection event handler on connection', () => {
    jest.spyOn(untypedEngine, 'onMessage').mockImplementation(() => {});

    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });

    engine.run();

    const relatedHandler = callbacks.find(cb => cb.evt === LifecycleEvents.MESSAGE);
    relatedHandler?.cb.call(client);

    expect(untypedEngine.onMessage).toHaveBeenCalled();
  });

  it('should add personality construct', () => {
    const mockCore = Mock.ofType<Personality>();

    expect(untypedEngine.personalityConstructs.length).toBe(0);

    engine.addPersonality(mockCore.object);

    expect(untypedEngine.personalityConstructs.length).toBe(1);
  });

  it('should run initialise on personality constructs if implemented', () => {
    const coreNoInit: Personality = {
      onAddressed: () => Promise.resolve(null),
      onMessage: () => Promise.resolve(null)
    };
    const coreWithInit: Personality = {
      initialise: () => null,
      onAddressed: () => Promise.resolve(null),
      onMessage: () => Promise.resolve(null)
    };
    const initSpy = jest.spyOn(coreWithInit, 'initialise');

    engine.addPersonality(coreNoInit);
    engine.addPersonality(coreWithInit);
    engine.initialise();

    // Not possible to assess whether the non-initialise version is not called,
    // but by getting here we haven't had an exception thrown.
    expect(initSpy).toHaveBeenCalled();
  });

  it('should run destroy on personality constructs if implemented', () => {
    const coreNoInit: Personality = {
      onAddressed: () => Promise.resolve(null),
      onMessage: () => Promise.resolve(null)
    };
    const coreWithDestroy: Personality = {
      destroy: () => null,
      onAddressed: () => Promise.resolve(null),
      onMessage: () => Promise.resolve(null)
    };
    const destroySpy = jest.spyOn(coreWithDestroy, 'destroy');

    engine.addPersonality(coreNoInit);
    engine.addPersonality(coreWithDestroy);
    engine.destroy();

    // Not possible to assess whether the non-initialise version is not called,
    // but by getting here we haven't had an exception thrown.
    expect(destroySpy).toHaveBeenCalled();
  });

  it('should disconnect on destroy', () => {
    engine.destroy();

    client.verify(c => c.disconnect(), Times.once());
  });

  it('should handle ambient messages when message received', () => {
    jest.spyOn(untypedEngine, 'calculateAddressedMessage').mockReturnValue(null);
    jest.spyOn(untypedEngine, 'handleAmbientMessage').mockImplementation(() => {});

    untypedEngine.onMessage({});

    expect(untypedEngine.handleAmbientMessage).toHaveBeenCalled();
  });

  it('should handle addressed messages when message received', () => {
    jest.spyOn(untypedEngine, 'calculateAddressedMessage').mockReturnValue('test');
    jest.spyOn(untypedEngine, 'handleAddressedMessage').mockImplementation(() => {});

    untypedEngine.onMessage({});

    expect(untypedEngine.handleAddressedMessage).toHaveBeenCalled();
  });

  it('should send message when one is generated as a response', done => {
    const mockMessage = 'hello world';
    const fakeMessageFns = [Promise.resolve(mockMessage), Promise.resolve(null)];

    untypedEngine.dequeuePromises(fakeMessageFns).catch((err: Error) => expect(err instanceof HandledResponseError).toBeTruthy());

    setTimeout(() => {
      client.verify(c => c.queueMessages(It.isValue([mockMessage])), Times.once());
      done();
    }, 100);
  });

  it('should handle an exception being thrown', done => {
    const failureMessage = 'I am a failure';
    const fakeMessageFns = [Promise.reject(failureMessage), Promise.resolve(null)];

    untypedEngine
      .dequeuePromises(fakeMessageFns)
      .then(() => fail('should not get here'))
      .catch((err: string) => {
        expect(err).toBe(failureMessage);
        client.verify(c => c.queueMessages(It.isAny()), Times.never());
        done();
      });
  });

  it('should queue messages from personality cores', () => {
    let queuedPromises = [];
    const mockMessage = { content: 'lol hello' };
    jest.spyOn(untypedEngine, 'dequeuePromises').mockImplementation((arg: any) => {
      queuedPromises = arg;
      return Promise.resolve(null);
    });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore.setup(m => m.onMessage(It.isAny())).returns(() => Promise.resolve(null));
    untypedEngine.personalityConstructs = [mockPersonalityCore.object];

    untypedEngine.handleAmbientMessage(mockMessage);

    expect(untypedEngine.dequeuePromises).toHaveBeenCalled();
    expect(queuedPromises.length).toBe(1);
  });

  it('should detect when being addressed', () => {
    interface InputOutputPair {
      input: string;
      expectedOutput: string | null;
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

    messageMappedToExpectedResults.forEach((kvp: InputOutputPair) => {
      client.setup(m => m.getUserInformation()).returns(() => mockUserInfo.object);
      const mockMessage = {
        content: kvp.input,
        guild: { members: { resolve: () => null } }
      };
      const actualResult = untypedEngine.calculateAddressedMessage(mockMessage);
      expect(actualResult).toBe(kvp.expectedOutput);
    });
  });

  it('should detect if addressed and username overriden in guild', () => {
    const overridenUsername = 'totally_not_a_bot';

    client.setup(m => m.getUserInformation()).returns(() => mockUserInfo.object);
    const mockMessage = {
      content: `${overridenUsername}, hello`,
      guild: { members: { resolve: () => ({ nickname: overridenUsername }) } }
    };

    const actualResult = untypedEngine.calculateAddressedMessage(mockMessage);
    expect(actualResult).toBe('hello');
  });

  it('should queue addressed messages from personality cores', () => {
    let queuedPromises = [];
    const messageText = 'lol hello';
    const mockMessage = { content: `${MOCK_USERNAME} ${messageText}` };
    jest.spyOn(untypedEngine, 'dequeuePromises').mockImplementation((arg: any) => {
      queuedPromises = arg;
      return Promise.resolve(null);
    });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore.setup(m => m.onAddressed(It.isAny(), It.isAnyString())).returns(() => Promise.resolve(null));
    untypedEngine.personalityConstructs = [mockPersonalityCore.object];

    untypedEngine.handleAddressedMessage(mockMessage, messageText);

    expect(untypedEngine.dequeuePromises).toHaveBeenCalled();
    expect(queuedPromises.length).toBe(1);
  });

  // Run all help tests with each help command
  // This is disgusting but can't think of a cleaner way to do it
  helpCommands.forEach(helpCommand => {
    describe(`Help functionality using ${helpCommand}`, () => {
      const helpText = 'I’m helping';
      const coreWithHelp: Personality = {
        onAddressed: () => Promise.resolve(null),
        onMessage: () => Promise.resolve(null),
        onHelp: () => Promise.resolve(helpText)
      };

      let mockMessage: IMock<Message>;
      let messageQueue: MessageType[];

      beforeEach(() => {
        const mockGuild = Mock.ofType<Guild>();
        mockGuild
          .setup(g => g.members)
          .returns(
            () =>
              ({
                resolve: (): any => undefined
              } as any)
          );

        mockMessage = Mock.ofType<Message>();
        mockMessage.setup(msg => msg.guild).returns(() => mockGuild.object);

        messageQueue = [];
        client.setup(c => c.queueMessages(It.isAny())).callback(messages => messageQueue.push(...messages));
      });

      it('should respond with help and plugin summary if no personality core supplied and core loaded', () => {
        const messageText = `${MOCK_USERNAME} ${helpCommand}`;
        engine.addPersonality(coreWithHelp);

        mockMessage.setup(msg => msg.content).returns(() => messageText);
        untypedEngine.onMessage(mockMessage.object);

        expect(messageQueue.length).toBe(2);

        // Summary text
        expect(typeof messageQueue[0]).toBe('string');
        expect(messageQueue[0]).toBe(helpResponseText);

        // Embed
        const embed = messageQueue[1] as MessageEmbed;
        expect(embed.fields.length).toBe(1);
        expect(embed.fields[0].name).toBe('Help topics');
      });

      it('should respond with help and no topics if no personality core supplied and no cores loaded', () => {
        const messageText = `${MOCK_USERNAME} ${helpCommand}`;

        mockMessage.setup(msg => msg.content).returns(() => messageText);
        untypedEngine.onMessage(mockMessage.object);

        expect(messageQueue.length).toBe(2);

        // Summary text
        expect(typeof messageQueue[0]).toBe('string');
        expect(messageQueue[0]).toBe(helpResponseText);

        // Embed
        const embed = messageQueue[1] as MessageEmbed;
        expect(embed.fields.length).toBe(1);
        expect(embed.fields[0].name).toBe('Help topics');
        expect(embed.fields[0].value).toBe('No topics');
      });

      it('should respond with plugin help if personality core supplied and loaded', done => {
        const messageText = `${MOCK_USERNAME} ${helpCommand} Object`;

        engine.addPersonality(coreWithHelp);

        mockMessage.setup(msg => msg.content).returns(() => messageText);
        untypedEngine.onMessage(mockMessage.object);

        setTimeout(() => {
          expect(messageQueue.length).toBe(1);
          expect(typeof messageQueue[0]).toBe('string');
          expect(messageQueue[0]).toBe(helpText);
          done();
        });
      });

      it('should respond with generic text if personality core supplied but not loaded', done => {
        const messageText = `${MOCK_USERNAME} ${helpCommand} Object`;

        mockMessage.setup(msg => msg.content).returns(() => messageText);
        untypedEngine.onMessage(mockMessage.object);

        setTimeout(() => {
          expect(messageQueue.length).toBe(1);
          expect(typeof messageQueue[0]).toBe('string');
          expect(messageQueue[0]).toBe('No help for that!');
          done();
        });
      });
    });
  });
});
