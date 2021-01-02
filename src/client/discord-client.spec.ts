import * as discord from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import * as LifecycleEvents from '../constants/lifecycle-events';
import { DiscordClient } from './discord-client';
import { messageEvent, readyEvent } from './discord-events';

const MOCK_TOKEN = '12345abcde';

const MOCK_CHAN_1_ID = 'chan1';
const MOCK_CHAN_1_NAME = 'chan1 name';

const MOCK_CHAN_2_ID = 'chan2';
const MOCK_CHAN_2_NAME = 'chan2 name';

// Can’t seem to mock discord.Channel using TypeMoq so this is hacky
const MOCK_CHANNELS = new Map<string, any>();
MOCK_CHANNELS.set(MOCK_CHAN_1_ID, {
  id: MOCK_CHAN_1_ID,
  name: MOCK_CHAN_1_NAME
});
MOCK_CHANNELS.set(MOCK_CHAN_2_ID, {
  id: MOCK_CHAN_2_ID,
  name: MOCK_CHAN_2_NAME
});

describe('Discord client wrapper', () => {
  let discordMock: IMock<discord.Client>;
  let client: DiscordClient;
  let mockChannels: IMock<discord.ChannelManager>;

  beforeEach(() => {
    discordMock = Mock.ofType<discord.Client>();

    mockChannels = Mock.ofType<discord.ChannelManager>();
    mockChannels
      .setup((c) => c.resolve(It.isAnyString()))
      .returns((id) => MOCK_CHANNELS.get(id));

    client = new DiscordClient(console);
    spyOn(client as any, 'generateClient').and.returnValue(discordMock.object);
  });

  it('should connect with token', () => {
    discordMock.setup((m) => m.login(It.isAnyString()));

    client.connect(MOCK_TOKEN);

    discordMock.verify((m) => m.login(It.isValue(MOCK_TOKEN)), Times.once());
  });

  it('should disconnect if connected', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup((m) => m.destroy());

    client.disconnect();

    discordMock.verify((m) => m.destroy(), Times.once());
  });

  it('should initialise event listeners on connect', () => {
    // discordMock.setup(m => m.on(It.isAny(), It.isAny()));

    client.connect(MOCK_TOKEN);

    // Connected and message
    discordMock.verify(
      (m) => m.on(It.isValue(readyEvent), It.isAny()),
      Times.once()
    );
    discordMock.verify(
      (m) => m.on(It.isValue(messageEvent), It.isAny()),
      Times.once()
    );
  });

  it('should add connection event handler on connection', () => {
    const untypedClient = client as any;
    spyOn(untypedClient, 'onConnected');
    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    discordMock
      .setup((m) => m.on(It.isAny(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });

    client.connect(MOCK_TOKEN);

    const relatedHandler = callbacks.find((cb) => cb.evt === readyEvent);
    relatedHandler.cb.call(client);

    expect(untypedClient.onConnected).toHaveBeenCalled();
  });

  it('should add message event handler on connection', () => {
    const untypedClient = client as any;
    spyOn(untypedClient, 'onMessage');
    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    discordMock
      .setup((m) => m.on(It.isAny(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });

    client.connect(MOCK_TOKEN);

    const relatedHandler = callbacks.find((cb) => cb.evt === messageEvent);
    relatedHandler.cb.call(client);

    expect(untypedClient.onMessage).toHaveBeenCalled();
  });

  it('should find channel by id', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup((m) => m.channels).returns(() => mockChannels.object);

    const channel = client.findChannelById(MOCK_CHAN_1_ID);

    // It's not possible to mock channels using their type definition
    expect((channel as any).name).toBe(MOCK_CHAN_1_NAME);
  });

  it('should return null if cannot find channel by id', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup((m) => m.channels).returns(() => mockChannels.object);

    const channel = client.findChannelById('SomethingThatDoesNotExist');

    expect(channel).toBeNull();
  });

  it('should queue messages', () => {
    const untypedClient = client as any;
    spyOn(untypedClient, 'sendMessage');

    const messages = ['one', 'two', 'three'];
    client.queueMessages(messages);

    expect(untypedClient.sendMessage).toHaveBeenCalledTimes(messages.length);
  });

  it('should send queued messages', () => {
    let sendCount = 0;
    const mockChannel = {
      send: (message: string) => {
        sendCount += 1;
      }
    };
    const untypedClient = client as any;
    untypedClient.lastMessage = { channel: mockChannel };

    const messages = ['one', 'two', 'three'];
    client.queueMessages(messages);

    expect(sendCount).toBe(3);
  });

  it('should replace user string with last message user name', () => {
    const expectedName = 'bob-bobertson';
    let lastMessage: string = null;
    const mockChannel = {
      send: (message: string) => (lastMessage = message)
    };
    const untypedClient = client as any;
    untypedClient.lastMessage = {
      channel: mockChannel,
      author: { username: expectedName }
    };

    const messages = ['{£user} {£user} {£user}'];
    client.queueMessages(messages);

    expect(lastMessage).toBe(`${expectedName} ${expectedName} ${expectedName}`);
  });

  it('should get user information', () => {
    const username = 'test';
    const mockUserInfo = Mock.ofType<discord.ClientUser>();
    mockUserInfo.setup((m) => m.username).returns(() => username);
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup((m) => m.user).returns(() => mockUserInfo.object);

    const user = client.getUserInformation();

    expect(user.username).toBe(username);
  });

  it('should get online status', () => {
    const states = [true, false];
    states.forEach((state: boolean) => {
      (client as any).connected = state;
      expect(client.isConnected()).toBe(state);
    });
  });

  it('should handle connection event', () => {
    let eventRaised = false;
    const callbacks: Array<{ evt: string; cb: () => void }> = [];
    discordMock
      .setup((m) => m.on(It.isAny(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });
    client.on(LifecycleEvents.CONNECTED, () => {
      eventRaised = true;
    });

    client.connect(MOCK_TOKEN);

    const relatedHandler = callbacks.find((cb) => cb.evt === readyEvent);
    relatedHandler.cb.call(client);

    expect(eventRaised).toBeTruthy();
  });

  function messageHandlerTest(mockMessage: any): boolean {
    let eventRaised = false;
    const callbacks: Array<{ evt: string; cb: (a: any) => void }> = [];
    discordMock
      .setup((m) => m.on(It.isAny(), It.isAny()))
      .callback((evt: string, cb: () => void) => {
        callbacks.push({ evt, cb });
      });
    client.connect(MOCK_TOKEN);
    client.on(LifecycleEvents.MESSAGE, () => {
      eventRaised = true;
    });

    const relatedHandler = callbacks.find((cb) => cb.evt === messageEvent);
    relatedHandler.cb.call(client, mockMessage);

    return eventRaised;
  }

  it('should handle incoming message event from text channel', () => {
    const mockMessage = {
      channel: { type: 'text' },
      content: 'text message',
      user: {}
    };

    const eventRaised = messageHandlerTest(mockMessage);
    expect(eventRaised).toBeTruthy();
  });

  it('should not handle incoming message event from non-text channel', () => {
    const mockMessage = {
      channel: { type: 'dm' },
      content: 'text message',
      user: {}
    };

    const eventRaised = messageHandlerTest(mockMessage);
    expect(eventRaised).toBeFalsy();
  });

  it('should set presence data', () => {
    const mockUser = Mock.ofType<discord.ClientUser>();
    discordMock.setup((m) => m.user).returns(() => mockUser.object);
    const mockPresence = { activity: {} };
    (client as any).client = discordMock.object; // This is set when connected

    client.setPresence(mockPresence);

    mockUser.verify(
      (u) => u.setPresence(It.isValue(mockPresence)),
      Times.once()
    );
  });
});
