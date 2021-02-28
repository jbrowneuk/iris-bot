import { Guild, Message, MessageEmbed, TextChannel } from 'discord.js';
import { IMock, Mock } from 'typemoq';

import {
    announceCommand, McServer, noAssociationCopy, ServerInformation,
    ServerResponse, setCommand, statusCommand
} from './mc-server';

import util = require('minecraft-server-util');

class TestableMcServer extends McServer {
  public setMockServer(discordId: string, info: ServerInformation): void {
    this.servers.set(discordId, info);
  }

  public getServers(): Map<string, ServerInformation> {
    return this.servers;
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
  let personality: TestableMcServer;
  let mockServerInfo: ServerInformation;

  beforeEach(() => {
    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup((m) => m.id).returns(() => MOCK_GUILD_ID);

    mockChannel = Mock.ofType<TextChannel>();
    mockChannel.setup((m) => m.id).returns(() => MOCK_CHANNEL_ID);
    mockChannel.setup((m) => m.name).returns(() => MOCK_CHANNEL_NAME);

    mockServerInfo = {
      url: 'localhost',
      channelId: null,
      lastKnownOnline: false
    };

    personality = new TestableMcServer();
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
        expect(embed.description).toBe('Saved the server to this Discord.');

        const servers = personality.getServers();
        expect(servers.has(MOCK_GUILD_ID)).toBeTrue();
        expect(servers.get(MOCK_GUILD_ID).url).toBe(mockUrl);
        done();
      });
    });
  });

  describe(`${announceCommand} messages`, () => {
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

  describe('Addressed messages', () => {
    it('should resolve to null', (done) => {
      personality.onAddressed().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Help messages', () => {
    it('should resolve to null', (done) => {
      personality.onHelp().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });
});
