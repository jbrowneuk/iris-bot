import * as discord from 'discord.js';
import { IMock, Mock, It, Times } from 'typemoq';
import { DiscordClient } from './discord-client';

import { DISCORD_EVENTS } from './discord-events';

const MOCK_TOKEN = '12345abcde';

const MOCK_CHAN_1_ID = 'chan1';
const MOCK_CHAN_1_NAME = 'chan1 name';

const MOCK_CHAN_2_ID = 'chan2';
const MOCK_CHAN_2_NAME = 'chan2 name';

// Can’t seem to mock discord.Channel using TypeMoq so this is hacky
const MOCK_CHANNELS = new discord.Collection<string, any>();
MOCK_CHANNELS.set(MOCK_CHAN_1_ID, {
  name: MOCK_CHAN_1_NAME,
  id: MOCK_CHAN_1_ID
});
MOCK_CHANNELS.set(MOCK_CHAN_2_ID, {
  name: MOCK_CHAN_2_NAME,
  id: MOCK_CHAN_2_ID
});

describe('Discord client wrapper', () => {
  let discordMock: IMock<discord.Client>;
  let client: DiscordClient;

  beforeEach(() => {
    discordMock = Mock.ofType<discord.Client>();

    client = new DiscordClient();
    spyOn(client as any, 'generateClient').and.returnValue(discordMock.object);
  });

  it('should connect with token', () => {
    discordMock.setup(m => m.login(It.isAnyString()));

    client.connect(MOCK_TOKEN);

    discordMock.verify(m => m.login(It.isValue(MOCK_TOKEN)), Times.once());
  });

  it('should disconnect if connected', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup(m => m.destroy());

    client.disconnect();

    discordMock.verify(m => m.destroy(), Times.once());
  });

  it('should initialise event listeners on connect', () => {
    discordMock.setup(m => m.on(It.isAnyString(), It.isAny()));

    client.connect(MOCK_TOKEN);

    // Connected and message
    discordMock.verify(
      m => m.on(It.isValue(DISCORD_EVENTS.connected), It.isAny()),
      Times.once()
    );
    discordMock.verify(
      m => m.on(It.isValue(DISCORD_EVENTS.message), It.isAny()),
      Times.once()
    );
  });

  it('should add connection event handler on connection', () => {
    const untypedClient = client as any;
    spyOn(untypedClient, 'onConnected');
    const callbacks: { evt: string; cb: Function }[] = [];
    discordMock
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: Function) => {
        callbacks.push({ evt, cb });
      });

    client.connect(MOCK_TOKEN);

    const relatedHandler = callbacks.find(
      cb => cb.evt === DISCORD_EVENTS.connected
    );
    relatedHandler.cb.call(client);

    expect(untypedClient.onConnected).toHaveBeenCalled();
  });

  it('should add message event handler on connection', () => {
    const untypedClient = client as any;
    spyOn(untypedClient, 'onMessage');
    const callbacks: { evt: string; cb: Function }[] = [];
    discordMock
      .setup(m => m.on(It.isAnyString(), It.isAny()))
      .callback((evt: string, cb: Function) => {
        callbacks.push({ evt, cb });
      });

    client.connect(MOCK_TOKEN);

    const relatedHandler = callbacks.find(
      cb => cb.evt === DISCORD_EVENTS.message
    );
    relatedHandler.cb.call(client);

    expect(untypedClient.onMessage).toHaveBeenCalled();
  });

  it('should find channel by id', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup(m => m.channels).returns(() => MOCK_CHANNELS);

    const channel = client.findChannelById(MOCK_CHAN_1_ID);

    // It's not possible to mock channels using their type definition
    expect((channel as any).name).toBe(MOCK_CHAN_1_NAME);
  });

  it('should return null if cannot find channel by id', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup(m => m.channels).returns(() => MOCK_CHANNELS);

    const channel = client.findChannelById('SomethingThatDoesNotExist');

    expect(channel).toBeNull();
  });

  it('should find channel by name', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup(m => m.channels).returns(() => MOCK_CHANNELS);

    const channel = client.findChannelByName(MOCK_CHAN_2_NAME);

    expect(channel.id).toBe(MOCK_CHAN_2_ID);
  });

  it('should return null if cannot find channel by name', () => {
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup(m => m.channels).returns(() => MOCK_CHANNELS);

    const channel = client.findChannelByName('This channel does not exist');

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

  it('should get user information', () => {
    const username = 'test';
    const mockUserInfo = Mock.ofType<discord.ClientUser>();
    mockUserInfo.setup(m => m.username).returns(() => username);
    (client as any).client = discordMock.object; // This is set when connected
    discordMock.setup(m => m.user).returns(() => mockUserInfo.object);

    const user = client.getUserInformation();

    expect(user.username).toBe(username);
  });
});
