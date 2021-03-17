import { Guild, Message, MessageEmbed, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { IMock, It, Mock } from 'typemoq';

import { Client } from '../interfaces/client';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import {
    announceCommand, linkServerCopy, McServer, noAssociationCopy, ServerInformation, ServerResponse, setCommand, statusCommand
} from './mc-server';

import util = require('minecraft-server-util');

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
    return this.timerInterval && this.timerInterval > 0;
  }
}

const MOCK_GUILD_ID = 'mockguild';
const MOCK_CHANNEL_ID = 'mockchannel';
const MOCK_CHANNEL_NAME = 'mock channel name';

const MOCK_RUNNING_STATUS: ServerResponse = {
  version: '1.16.2',
  onlinePlayers: 1,
  maxPlayers: 5,
  samplePlayers: [{ name: 'bob-bobertson' }]
};

describe('Minecraft server utilities', () => {
  let mockGuild: IMock<Guild>;
  let mockChannel: IMock<TextChannel>;
  let mockClient: IMock<Client>;
  let personality: TestableMcServer;
  let mockServerInfo: ServerInformation;
  let mockDependencies: DependencyContainer;

  beforeEach(() => {
    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup((m) => m.id).returns(() => MOCK_GUILD_ID);

    mockChannel = Mock.ofType<TextChannel>();
    mockChannel.setup((m) => m.id).returns(() => MOCK_CHANNEL_ID);
    mockChannel.setup((m) => m.name).returns(() => MOCK_CHANNEL_NAME);

    mockClient = Mock.ofType<Client>();

    mockServerInfo = {
      url: 'localhost',
      channelId: null,
      lastKnownOnline: false
    };

    const mockLogger = Mock.ofType<Logger>();
    mockDependencies = {
      client: mockClient.object,
      database: null,
      engine: null,
      logger: mockLogger.object,
      responses: null,
      settings: null
    };

    personality = new TestableMcServer(mockDependencies);
  });

  afterEach(() => {
    personality.destroy();
  });

  describe(`${statusCommand} messages`, () => {
    it('should return embed with error if no server associated', (done) => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => statusCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      spyOn(util, 'status').and.callFake(() =>
        Promise.resolve<any>(MOCK_RUNNING_STATUS)
      );

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toBe(noAssociationCopy);
        done();
      });
    });

    it('should return embed with server info if server associated', (done) => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => statusCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      spyOn(util, 'status').and.callFake(() =>
        Promise.resolve<any>(MOCK_RUNNING_STATUS)
      );

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toContain('Your server is online');
        done();
      });
    });

    it('should reflect offline status if server offline', (done) => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => statusCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      spyOn(util, 'status').and.callFake(() => Promise.resolve<any>(null));

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toContain('Your server is offline');
        done();
      });
    });

    it('should reflect offline status if server offline', (done) => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => statusCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      spyOn(util, 'status').and.callFake(() =>
        Promise.resolve<any>(MOCK_RUNNING_STATUS)
      );

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toContain('Your server is');
        done();
      });
    });
  });

  describe(`${setCommand} messages`, () => {
    beforeEach(() => {
      // Make sure this isn't persisted to file
      spyOn(fs, 'writeFile');
    });

    it('should return embed with usage instructions if no param provided', (done) => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => setCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toContain('Usage:');
        done();
      });
    });

    it('should set server url for current guild', (done) => {
      const mockUrl = 'my-url.is-not-a.real-url';

      const mockMessage = Mock.ofType<Message>();
      mockMessage
        .setup((m) => m.content)
        .returns(() => `${setCommand} ${mockUrl}`);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toBe(linkServerCopy);

        const servers = personality.getServers();
        expect(servers.has(MOCK_GUILD_ID)).toBeTrue();
        expect(servers.get(MOCK_GUILD_ID).url).toBe(mockUrl);
        done();
      });
    });
  });

  describe(`${announceCommand} messages`, () => {
    beforeEach(() => {
      // Make sure this isn't persisted to file
      spyOn(fs, 'writeFile');
    });

    it('should return embed with error if no server associated', (done) => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => announceCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.title).toBeTruthy();
        expect(embed.description).toBe(noAssociationCopy);
        done();
      });
    });

    it('should store channel id for guild if server associated', (done) => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => announceCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);
      mockMessage.setup((m) => m.channel).returns(() => mockChannel.object);

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBeTruthy();
        const embed = response as MessageEmbed;
        expect(embed.description).toContain('Announcing');

        const storedServers = personality.getServers();
        const currentGuild = storedServers.get(MOCK_GUILD_ID);
        expect(currentGuild.channelId).toBe(MOCK_CHANNEL_ID);
        done();
      });
    });
  });

  describe('Automatic status update', () => {
    it('should set update timer on initialise', () => {
      spyOn(fs, 'readFile'); // block settings loading

      personality.initialise();
      expect(personality.hasTimer()).toBe(true);
    });

    it('should fetch server status for known servers', (done) => {
      const statusUpdateHandler = spyOn(util, 'status').and.callFake(() =>
        Promise.resolve<any>(MOCK_RUNNING_STATUS)
      );

      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(statusUpdateHandler).toHaveBeenCalledWith(mockServerInfo.url);
        done();
      });
    });

    it('should post status to channel if server comes online', (done) => {
      let embed: MessageEmbed;
      spyOn(util, 'status').and.callFake(() =>
        Promise.resolve<any>(MOCK_RUNNING_STATUS)
      );
      mockClient
        .setup((m) => m.findChannelById(It.isAny()))
        .returns(() => mockChannel.object);
      mockChannel.setup((m) => m.send(It.isAny())).callback((e) => (embed = e));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = false;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeTruthy();
        expect(embed.description).toContain('Your server is online');
        done();
      });
    });

    it('should post status to channel if server goes offline', (done) => {
      let embed: MessageEmbed;
      spyOn(util, 'status').and.callFake(() => Promise.resolve<any>(null));
      mockClient
        .setup((m) => m.findChannelById(It.isAny()))
        .returns(() => mockChannel.object);
      mockChannel.setup((m) => m.send(It.isAny())).callback((e) => (embed = e));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = true;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeTruthy();
        expect(embed.description).toContain('Your server is offline');
        done();
      });
    });

    it('should post offline status to channel if server becomes unreachable', (done) => {
      let embed: MessageEmbed;
      spyOn(util, 'status').and.callFake(() => Promise.reject(null));
      mockClient
        .setup((m) => m.findChannelById(It.isAny()))
        .returns(() => mockChannel.object);
      mockChannel.setup((m) => m.send(It.isAny())).callback((e) => (embed = e));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = true;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeTruthy();
        expect(embed.description).toContain('Your server is offline');
        done();
      });
    });

    it('should not post status to channel if server is online and status does not change', (done) => {
      let embed: MessageEmbed;
      spyOn(util, 'status').and.callFake(() =>
        Promise.resolve<any>(MOCK_RUNNING_STATUS)
      );
      mockClient
        .setup((m) => m.findChannelById(It.isAny()))
        .returns(() => mockChannel.object);
      mockChannel.setup((m) => m.send(It.isAny())).callback((e) => (embed = e));

      mockServerInfo.channelId = MOCK_CHANNEL_ID;
      mockServerInfo.lastKnownOnline = true;
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      personality.invokeFetch();
      setTimeout(() => {
        expect(embed).toBeFalsy();
        done();
      });
    });

    it('should not post status to channel if server is offline and status does not change', (done) => {
      let embed: MessageEmbed;
      spyOn(util, 'status').and.callFake(() => Promise.resolve<any>(null));
      mockClient
        .setup((m) => m.findChannelById(It.isAny()))
        .returns(() => mockChannel.object);
      mockChannel.setup((m) => m.send(It.isAny())).callback((e) => (embed = e));

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

  describe('persisting settings', () => {
    let writeSpy: jasmine.Spy;

    beforeEach(() => {
      // Make sure this isn't persisted to file
      writeSpy = spyOn(fs, 'writeFile');
    });

    it('should load settings on initialise', () => {
      const mockUrl = 'mock-url';
      const mockChannelId = 'mock-id';
      const fakeReadFile = (
        path: string,
        enc: string,
        cb: (err: any, data: string) => void
      ) => {
        expect(path).toBeTruthy();
        expect(enc).toBeTruthy();
        cb(
          null,
          `{ "${MOCK_GUILD_ID}": { "url": "${mockUrl}", "channelId": "${mockChannelId}" } }`
        );
      };

      spyOn(fs, 'readFile').and.callFake(fakeReadFile as any);

      personality.initialise();

      const servers = personality.getServers();
      const serverInfo = servers.get(MOCK_GUILD_ID);
      expect(serverInfo).toBeTruthy();
      expect(serverInfo.url).toBe(mockUrl);
      expect(serverInfo.channelId).toBe(mockChannelId);
      expect(serverInfo.lastKnownOnline).toBe(false);
    });

    it(`should persist settings on ${setCommand}`, (done) => {
      const mockUrl = 'my-url.is-not-a.real-url';

      const mockMessage = Mock.ofType<Message>();
      mockMessage
        .setup((m) => m.content)
        .returns(() => `${setCommand} ${mockUrl}`);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);

      personality.onMessage(mockMessage.object).then(() => {
        expect(writeSpy).toHaveBeenCalled();
        done();
      });
    });

    it(`should persist settings on ${announceCommand}`, (done) => {
      personality.setMockServer(MOCK_GUILD_ID, mockServerInfo);

      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => announceCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);
      mockMessage.setup((m) => m.channel).returns(() => mockChannel.object);

      personality.onMessage(mockMessage.object).then(() => {
        expect(writeSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Addressed messages', () => {
    it('should resolve to null', (done) => {
      personality.onAddressed().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Help messages', () => {
    it('should resolve to embed', (done) => {
      personality.onHelp().then((response) => {
        expect(response).not.toBeNull();
        const embed = response as MessageEmbed;
        expect(embed.fields.length).toBe(3);

        done();
      });
    });
  });
});
