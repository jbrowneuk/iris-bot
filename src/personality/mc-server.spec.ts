import * as axios from 'axios';
import { Guild, Message, MessageEmbed, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock } from 'typemoq';

import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { announceCommand, defaultDescription, noAssociationCopy, setCommand, statusCommand } from './constants/mc-server';
import { ServerInformation, ServerResponse } from './interfaces/mc-server';
import { McServer } from './mc-server';

jest.mock('fs', () => ({
  readFile: jest.fn().mockImplementation((path, opts, callback) => callback(null, null)),
  writeFile: jest.fn().mockImplementation((path, data, opts, callback) => callback())
}));

class TestableMcServer extends McServer {
  public setMockServer(discordId: string, info: ServerInformation): void {
    this.servers.set(discordId, info);
  }

  public getServers(): Map<string, ServerInformation> {
    return this.servers;
  }

  public invokeFetch(): void {
    this.fetchStatuses();
  }

  public hasTimer(): boolean {
    if (!this.timerInterval) {
      return false;
    }

    if (typeof this.timerInterval === 'number') {
      return this.timerInterval > 0;
    }

    return this.timerInterval.hasRef();
  }

  public invokeGetServerStatus() {
    return this.getServerStatus('localhost');
  }
}

const mockOfflineResponse: ServerResponse = {
  online: false,
  host: 'offline-server',
  port: 4200
};

const mockOnlineResponse: ServerResponse = {
  online: true,
  host: 'online-server',
  port: 25565,
  version: {
    name_clean: 'Paper 1.19.2'
  },
  players: {
    online: 0,
    max: 5,
    list: []
  },
  motd: {
    clean: 'Local Server'
  },
  icon: 'data:image/png;base64,...'
};

const mockOnlineNoMotdResponse: ServerResponse = {
  online: true,
  host: 'online-server',
  port: 25565,
  version: {
    name_clean: '1.19.2'
  }
};

const mockExarotonResponse: ServerResponse = {
  online: true,
  host: 'testserver.exaroton.me',
  port: 25565,
  version: {
    name_clean: '◉ Sleeping'
  },
  players: {
    online: 0,
    max: 10,
    list: []
  },
  motd: {
    clean: 'The Unofficial LoadingArtist Community Server'
  },
  icon: 'data:image/png;base64,...'
};

const MOCK_GUILD_ID = 'mockguild';
const MOCK_CHANNEL_ID = 'mockchannel';
const MOCK_GUILD_NAME = 'mock name';
const MOCK_CHANNEL_NAME = 'mock channel name';

describe('Minecraft server utilities', () => {
  let mockGuild: IMock<Guild>;
  let mockChannel: IMock<TextChannel>;
  let mockClient: IMock<Client>;
  let personality: TestableMcServer;
  let mockServerInfo: ServerInformation;
  let mockDependencies: DependencyContainer;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(axios.default, 'get');

    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup(m => m.id).returns(() => MOCK_GUILD_ID);
    mockGuild.setup(m => m.name).returns(() => MOCK_GUILD_NAME);

    mockChannel = Mock.ofType<TextChannel>();
    mockChannel.setup(m => m.id).returns(() => MOCK_CHANNEL_ID);
    mockChannel.setup(m => m.name).returns(() => MOCK_CHANNEL_NAME);

    mockClient = Mock.ofType<Client>();

    mockServerInfo = {
      url: 'test-server-url',
      channelId: null,
      lastKnownOnline: false
    };

    const mockLogger = Mock.ofType<Logger>();
    mockDependencies = {
      client: mockClient.object,
      database: Mock.ofType<Database>().object,
      engine: Mock.ofType<Engine>().object,
      logger: mockLogger.object,
      responses: Mock.ofType<ResponseGenerator>().object,
      settings: Mock.ofType<Settings>().object
    };

    personality = new TestableMcServer(mockDependencies);
  });

  afterEach(() => {
    personality.destroy();
    fetchSpy.mockRestore();
  });

  describe(`${statusCommand} messages`, () => {
    it('should return embed with error if no server associated', done => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => statusCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineResponse });

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toBe(noAssociationCopy);
        done();
      });
    });

    it('should return embed with server info if server associated', done => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => statusCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineResponse });

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toContain('online');
        done();
      });
    });

    it('should reflect offline status if server offline', done => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => statusCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOfflineResponse });

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toContain('offline');
        done();
      });
    });

    it('should reflect online status if server online', done => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => statusCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineResponse });

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toContain('online');
        done();
      });
    });

    it('should provide default description if one is not provided by server', done => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => statusCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineNoMotdResponse });

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toContain(defaultDescription);
        done();
      });
    });

    it('should parse description if one is provided by server', done => {
      const descriptionText = 'my server description';
      const infoClone = Object.assign({}, mockOnlineResponse);
      infoClone.motd = { clean: descriptionText };
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => statusCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: infoClone });

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toContain(descriptionText);
        done();
      });
    });
  });

  describe(`${setCommand} messages`, () => {
    beforeEach(() => {
      // Make sure this isn't persisted to file
      jest.spyOn(fs, 'writeFile').mockImplementation(() => null);
    });

    it('should return embed with usage instructions if no param provided', done => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => setCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toContain('Usage:');
        done();
      });
    });

    it('should set server url for current guild', done => {
      const mockUrl = 'my-url.is-not-a.real-url';

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => `${setCommand} ${mockUrl}`);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.fields[0].value).toContain(mockUrl);
        expect(embed.fields[0].value).toContain(MOCK_GUILD_NAME);

        const servers = personality.getServers();
        expect(servers.has(MOCK_GUILD_ID)).toBe(true);
        expect(servers.get(MOCK_GUILD_ID)?.url).toBe(mockUrl);
        done();
      });
    });
  });

  describe(`${announceCommand} messages`, () => {
    beforeEach(() => {
      // Make sure this isn't persisted to file
      jest.spyOn(fs, 'writeFile').mockImplementation(() => null);
    });

    it('should return embed with error if no server associated', done => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => announceCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toBe(noAssociationCopy);
        done();
      });
    });

    it('should store channel id for guild if server associated', done => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => announceCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);
      mockMessage.setup(m => m.channel).returns(() => mockChannel.object);

      personality.onMessage(mockMessage.object).then(response => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toContain('Announcing');

        const storedServers = personality.getServers();
        const currentGuild = storedServers.get(MOCK_GUILD_ID);
        expect(currentGuild?.channelId).toBe(MOCK_CHANNEL_ID);
        done();
      });
    });
  });

  describe('Automatic status update', () => {
    it('should set update timer on initialise', () => {
      jest.spyOn(fs, 'readFile').mockImplementation(() => null); // block settings loading

      personality.initialise();
      expect(personality.hasTimer()).toBe(true);
    });

    it('should fetch server status for known servers', done => {
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineResponse });

      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();

      setTimeout(() => {
        const urlParam = fetchSpy.mock.calls[0][0];
        expect(urlParam).toContain(mockServerInfo.url);
        done();
      });
    });

    it('should post status to channel if server comes online', done => {
      let embed: MessageEmbed;
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineResponse });
      mockClient.setup(m => m.findChannelById(It.isAny())).returns(() => mockChannel.object);
      mockChannel.setup(m => m.send(It.isAny())).callback(e => (embed = e.embeds[0]));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = false;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeTruthy();
        expect(embed.title).toContain('online');
        done();
      });
    });

    it('should post status to channel if server goes offline', done => {
      let embed: MessageEmbed;
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOfflineResponse });
      mockClient.setup(m => m.findChannelById(It.isAny())).returns(() => mockChannel.object);
      mockChannel.setup(m => m.send(It.isAny())).callback(e => (embed = e.embeds[0]));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = true;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeTruthy();
        expect(embed.title).toContain('offline');
        done();
      });
    });

    it('should post offline status to channel if server becomes unreachable', done => {
      let embed: MessageEmbed;
      fetchSpy.mockRejectedValue({ status: StatusCodes.NOT_FOUND });
      mockClient.setup(m => m.findChannelById(It.isAny())).returns(() => mockChannel.object);
      mockChannel.setup(m => m.send(It.isAny())).callback(e => (embed = e.embeds[0]));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = true;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeTruthy();
        expect(embed.title).toContain('offline');
        done();
      });
    });

    it('should not post status to channel if server is online and status does not change', done => {
      let embed: MessageEmbed;
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockOnlineResponse });
      mockClient.setup(m => m.findChannelById(It.isAny())).returns(() => mockChannel.object);
      mockChannel.setup(m => m.send(It.isAny())).callback(e => (embed = e.embeds[0]));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = true;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeFalsy();
        done();
      });
    });

    it('should not post status to channel if server is offline and status does not change', done => {
      let embed: MessageEmbed;
      fetchSpy.mockRejectedValue({ status: StatusCodes.NOT_FOUND });
      mockClient.setup(m => m.findChannelById(It.isAny())).returns(() => mockChannel.object);
      mockChannel.setup(m => m.send(It.isAny())).callback(e => (embed = e.embeds[0]));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = false;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeFalsy();
        done();
      });
    });
  });

  describe('server status handling', () => {
    it('should provide valid status if server is reporting two part version', done => {
      const expectedVersion = '1.17';
      const modifiedResponse = { ...mockOnlineResponse, version: { name_clean: expectedVersion } };
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: modifiedResponse });

      personality.invokeGetServerStatus().then(response => {
        expect(response).toBeTruthy();
        expect(response.version?.name_clean).toBe(expectedVersion);
        done();
      });
    });

    it('should provide valid status if server is reporting three part version', done => {
      const expectedVersion = '1.17.1';
      const modifiedResponse = { ...mockOnlineResponse, version: { name_clean: expectedVersion } };
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: modifiedResponse });

      personality.invokeGetServerStatus().then(response => {
        expect(response).toBeTruthy();
        expect(response.version?.name_clean).toBe(expectedVersion);
        done();
      });
    });

    it('should provide valid status if server is reporting three part version with custom software', done => {
      const expectedVersion = 'Paper 1.17.1';
      const modifiedResponse = { ...mockOnlineResponse, version: { name_clean: expectedVersion } };
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: modifiedResponse });

      personality.invokeGetServerStatus().then(response => {
        expect(response).toBeTruthy();
        expect(response.version?.name_clean).toBe(expectedVersion);
        done();
      });
    });

    it('should provide null status if server is reporting Exaroton-style sleeping text', done => {
      fetchSpy.mockResolvedValue({ status: StatusCodes.OK, data: mockExarotonResponse });

      personality.invokeGetServerStatus().then(response => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('persisting settings', () => {
    let writeSpy: jest.SpyInstance;

    beforeEach(() => {
      // Make sure this isn't persisted to file
      writeSpy = jest.spyOn(fs, 'writeFile');
    });

    it('should load settings on initialise', () => {
      const mockUrl = 'mock-url';
      const mockChannelId = 'mock-id';
      const fakeReadFile = (path: string, enc: string, cb: (err: Error | null, data: string) => void) => {
        expect(path).toBeTruthy();
        expect(enc).toBeTruthy();
        cb(null, `{ "${MOCK_GUILD_ID}": { "url": "${mockUrl}", "channelId": "${mockChannelId}" } }`);
      };

      jest.spyOn(fs, 'readFile').mockImplementation(fakeReadFile as any);

      personality.initialise();

      const servers = personality.getServers();
      const serverInfo = servers.get(MOCK_GUILD_ID);
      expect(serverInfo).toBeTruthy();
      expect(serverInfo?.url).toBe(mockUrl);
      expect(serverInfo?.channelId).toBe(mockChannelId);
      expect(serverInfo?.lastKnownOnline).toBe(false);
    });

    it(`should persist settings on ${setCommand}`, done => {
      const mockUrl = 'my-url.is-not-a.real-url';

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => `${setCommand} ${mockUrl}`);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then(() => {
        expect(writeSpy).toHaveBeenCalled();
        done();
      });
    });

    it(`should persist settings on ${announceCommand}`, done => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => announceCommand);
      mockMessage.setup(m => m.guild).returns(() => mockGuild.object);
      mockMessage.setup(m => m.channel).returns(() => mockChannel.object);

      personality.onMessage(mockMessage.object).then(() => {
        expect(writeSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Addressed messages', () => {
    it('should resolve to null', done => {
      personality.onAddressed().then(response => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Help messages', () => {
    it('should resolve to embed', done => {
      personality.onHelp().then(response => {
        expect(response).not.toBeNull();
        done();
      });
    });
  });
});
