import { Guild, Message, MessageEmbed } from 'discord.js';
import { IMock, Mock } from 'typemoq';

import { McServer, ServerInformation, ServerResponse, statusCommand } from './mc-server';

import util = require('minecraft-server-util');

class TestableMcServer extends McServer {
  public SetMockServer(discordId: string, info: ServerInformation): void {
    this.servers.set(discordId, info);
  }
}

const MOCK_GUILD_ID = 'mockguild';
const MOCK_SERVER_INFO: ServerInformation = {
  url: 'localhost',
  channelId: null,
  lastKnownOnline: false
};

const MOCK_RUNNING_STATUS: ServerResponse = {
  version: '1.16.2',
  onlinePlayers: 1,
  maxPlayers: 5,
  samplePlayers: [{ name: 'bob-bobertson' }]
};

describe('Minecraft server utilities', () => {
  let mockGuild: IMock<Guild>;
  let personality: TestableMcServer;

  beforeEach(() => {
    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup((m) => m.id).returns(() => MOCK_GUILD_ID);

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
        expect(embed.description).toContain('No Minecraft server associated');
        done();
      });
    });

    it('should return embed with server info if server associated', (done) => {
      personality.SetMockServer(MOCK_GUILD_ID, MOCK_SERVER_INFO);

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
