import { Guild, GuildMember, GuildMemberManager, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { Client } from '../interfaces/client';
import { Logger } from '../interfaces/logger';
import { Personality } from '../interfaces/personality';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { MessageType } from '../types';
import { BotEngine, helpCommands, helpResponseText } from './bot-engine';
import { HandledResponseError } from './handled-response-error';

const MOCK_USERNAME = 'bot';
const MOCK_ID = 'BOT12345';

class TestableBotEngine extends BotEngine {
  public onConnectedSpy: jest.SpyInstance;
  public onMessageSpy: jest.SpyInstance;
  public calculateAddressedMessageSpy: jest.SpyInstance;
  public handleAmbientMessageSpy: jest.SpyInstance;
  public handleAddressedMessageSpy: jest.SpyInstance;
  public dequeueMessagePromisesSpy: jest.SpyInstance;

  public get cores() {
    return this.personalityConstructs;
  }

  constructor(client: Client, responses: ResponseGenerator, settings: Settings, logger: Logger) {
    super(client, responses, settings, logger);

    this.initialiseMocks();
  }

  private initialiseMocks() {
    // Mock out actual implementations for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const untypedEngine = this as any;
    this.onConnectedSpy = jest.spyOn(untypedEngine, 'onConnected');
    this.onMessageSpy = jest.spyOn(untypedEngine, 'onMessage');
    this.calculateAddressedMessageSpy = jest.spyOn(untypedEngine, 'calculateAddressedMessage');
    this.handleAmbientMessageSpy = jest.spyOn(untypedEngine, 'handleAmbientMessage');
    this.handleAddressedMessageSpy = jest.spyOn(untypedEngine, 'handleAddressedMessage');
    this.dequeueMessagePromisesSpy = jest.spyOn(untypedEngine, 'dequeueMessagePromises');
  }

  public triggerHandleMessage(msg: Message): void {
    this.onMessage(msg);
  }

  public triggerDequeueMessagePromises(source: Message, funcs: Array<Promise<MessageType>>): Promise<MessageType> {
    return this.dequeueMessagePromises(source, funcs);
  }

  public triggerHandleAddressedMessage(source: Message, text: string) {
    this.handleAddressedMessage(source, text);
  }

  public triggerHandleAmbientMessage(source: Message) {
    this.handleAmbientMessage(source);
  }

  public triggerCalculateAddressedMessage(source: Message) {
    return this.calculateAddressedMessage(source);
  }

  public setCores(cores: Personality[]) {
    this.personalityConstructs = cores;
  }
}

describe('Bot engine', () => {
  let client: IMock<Client>;
  let responseGenerator: IMock<ResponseGenerator>;
  let settings: IMock<Settings>;
  let mockUserInfo: IMock<User>;
  let mockMessage: IMock<Message>;
  let mockChannel: IMock<TextChannel>;

  let engine: TestableBotEngine;

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

    mockChannel = Mock.ofType();

    mockMessage = Mock.ofType();
    mockMessage.setup(m => m.channel).returns(() => mockChannel.object);

    engine = new TestableBotEngine(client.object, responseGenerator.object, settings.object, console);
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
    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });

    engine.run();

    const relatedHandler = callbacks.find(cb => cb.evt === LifecycleEvents.CONNECTED);
    relatedHandler?.cb.call(client);

    expect(engine.onConnectedSpy).toHaveBeenCalled();
  });

  it('should add message event handler on connection', () => {
    engine.onMessageSpy.mockImplementation(() => '');

    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    client
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });

    engine.run();

    const relatedHandler = callbacks.find(cb => cb.evt === LifecycleEvents.MESSAGE);
    relatedHandler?.cb.call(client);

    expect(engine.onMessageSpy).toHaveBeenCalled();
  });

  it('should add personality construct', () => {
    const mockCore = Mock.ofType<Personality>();

    expect(engine.cores.length).toBe(0);

    engine.addPersonality(mockCore.object);

    expect(engine.cores.length).toBe(1);
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
    engine.calculateAddressedMessageSpy.mockReturnValue(null);
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- stub the method, no impl
    engine.handleAmbientMessageSpy.mockImplementation(() => {});

    engine.triggerHandleMessage(Mock.ofType<Message>().object);

    expect(engine.handleAmbientMessageSpy).toHaveBeenCalled();
  });

  it('should handle addressed messages when message received', () => {
    engine.calculateAddressedMessageSpy.mockReturnValue('test');
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- stub the method, no impl
    engine.handleAmbientMessageSpy.mockImplementation(() => {});

    engine.triggerHandleMessage(Mock.ofType<Message>().object);

    expect(engine.handleAddressedMessageSpy).toHaveBeenCalled();
  });

  it('should send message when one is generated as a response', done => {
    const messageText = 'hello world';
    const fakeMessageFns = [Promise.resolve(messageText), Promise.resolve(null)];

    engine.triggerDequeueMessagePromises(mockMessage.object, fakeMessageFns).catch((err: Error) => expect(err instanceof HandledResponseError).toBeTruthy());

    setTimeout(() => {
      client.verify(c => c.queueMessages(It.isAny(), It.isValue([messageText])), Times.once());
      done();
    }, 100);
  });

  it('should handle an exception being thrown', done => {
    const failureMessage = 'I am a failure';
    const fakeMessageFns = [Promise.reject(failureMessage), Promise.resolve(null)];

    engine
      .triggerDequeueMessagePromises(mockMessage.object, fakeMessageFns)
      .then(() => fail('should not get here'))
      .catch((err: string) => {
        expect(err).toBe(failureMessage);
        client.verify(c => c.queueMessages(It.isAny(), It.isAny()), Times.never());
        done();
      });
  });

  it('should queue messages from personality cores', () => {
    let queuedPromises = [];
    const testMessage = Mock.ofType<Message>();
    testMessage.setup(s => s.content).returns(() => 'lol hello');
    engine.dequeueMessagePromisesSpy.mockImplementation((_, arg) => {
      queuedPromises = arg;
      return Promise.resolve(null);
    });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore.setup(m => m.onMessage(It.isAny())).returns(() => Promise.resolve(null));
    engine.setCores([mockPersonalityCore.object]);

    engine.triggerHandleAmbientMessage(testMessage.object);

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

      // Mock guild override
      const mockGuildMember = Mock.ofType<GuildMember>();
      const testGuildMemberManager = Mock.ofType<GuildMemberManager>();
      testGuildMemberManager.setup(g => g.resolve(It.isAny())).returns(() => mockGuildMember.object);

      // Mock up message
      const testGuild = Mock.ofType<Guild>();
      testGuild.setup(g => g.members).returns(() => testGuildMemberManager.object);
      const testMessage = Mock.ofType<Message>();
      testMessage.setup(m => m.content).returns(() => kvp.input);
      testMessage.setup(m => m.guild).returns(() => testGuild.object);

      const actualResult = engine.triggerCalculateAddressedMessage(testMessage.object);
      expect(actualResult).toBe(kvp.expectedOutput);
    });
  });

  it('should detect if addressed and username overriden in guild', () => {
    const overridenUsername = 'totally_not_a_bot';

    client.setup(m => m.getUserInformation()).returns(() => mockUserInfo.object);

    // Mock up guild override
    const mockGuildMember = Mock.ofType<GuildMember>();
    mockGuildMember.setup(g => g.nickname).returns(() => overridenUsername);
    const testGuildMemberManager = Mock.ofType<GuildMemberManager>();
    testGuildMemberManager.setup(g => g.resolve(It.isAny())).returns(() => mockGuildMember.object);

    // Mock up message
    const testGuild = Mock.ofType<Guild>();
    testGuild.setup(g => g.members).returns(() => testGuildMemberManager.object);
    const testMessage = Mock.ofType<Message>();
    testMessage.setup(m => m.content).returns(() => `${overridenUsername}, hello`);
    testMessage.setup(m => m.guild).returns(() => testGuild.object);

    const actualResult = engine.triggerCalculateAddressedMessage(testMessage.object);
    expect(actualResult).toBe('hello');
  });

  it('should queue addressed messages from personality cores', () => {
    let queuedPromises = [];
    const messageText = 'lol hello';
    engine.dequeueMessagePromisesSpy.mockImplementation((_, arg) => {
      queuedPromises = arg;
      return Promise.resolve(null);
    });
    const mockPersonalityCore = Mock.ofType<Personality>();
    mockPersonalityCore.setup(m => m.onAddressed(It.isAny(), It.isAnyString())).returns(() => Promise.resolve(null));
    engine.setCores([mockPersonalityCore.object]);

    const testMessage = Mock.ofType<Message>();
    testMessage.setup(m => m.content).returns(() => `${MOCK_USERNAME} ${messageText}`);
    engine.triggerHandleAddressedMessage(testMessage.object, messageText);

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

      let messageQueue: MessageType[];

      beforeEach(() => {
        const mockGuild = Mock.ofType<Guild>();
        mockGuild
          .setup(g => g.members)
          .returns(
            () =>
              ({
                resolve: () => undefined
              } as any)
          );

        mockMessage.setup(msg => msg.guild).returns(() => mockGuild.object);

        messageQueue = [];
        client.setup(c => c.queueMessages(It.isAny(), It.isAny())).callback((_, messages) => messageQueue.push(...messages));
      });

      it('should respond with help and plugin summary if no personality core supplied and core loaded', () => {
        const messageText = `${MOCK_USERNAME} ${helpCommand}`;
        engine.addPersonality(coreWithHelp);

        mockMessage.setup(msg => msg.content).returns(() => messageText);
        engine.triggerHandleMessage(mockMessage.object);

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
        engine.triggerHandleMessage(mockMessage.object);

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
        engine.triggerHandleMessage(mockMessage.object);

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
        engine.triggerHandleMessage(mockMessage.object);

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
