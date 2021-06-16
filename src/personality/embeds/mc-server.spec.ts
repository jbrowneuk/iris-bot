import { announceCommand, setCommand, statusCommand } from '../constants/mc-server';
import { ServerResponse } from '../interfaces/mc-server';
import * as embeds from './mc-server';

describe('Embed formatting for Minecraft server utilities', () => {
  describe('generateServerEmbed', () => {
    const serverUrl = 'url.here';
    const serverVersion = '1.2.3';

    const onlineWithPlayers: ServerResponse = {
      version: serverVersion,
      onlinePlayers: 2,
      maxPlayers: 4,
      samplePlayers: [{ name: 'a' }, { name: 'b' }]
    };

    const onlineNoPlayers: ServerResponse = {
      version: serverVersion,
      onlinePlayers: 0,
      maxPlayers: 4,
      samplePlayers: []
    };

    const onlinePlayersEmbed = embeds.generateServerEmbed(
      serverUrl,
      onlineWithPlayers
    );

    const onlineEmptyEmbed = embeds.generateServerEmbed(
      serverUrl,
      onlineNoPlayers
    );

    const offlineEmbed = embeds.generateServerEmbed(serverUrl, null);

    it('should have status in title', () => {
      expect(onlinePlayersEmbed.title).toContain('online');
      expect(onlineEmptyEmbed.title).toContain('online');
      expect(offlineEmbed.title).toContain('offline');
    });

    it('should have server address in description', () => {
      expect(onlinePlayersEmbed.description).toContain(serverUrl);
      expect(onlineEmptyEmbed.description).toContain(serverUrl);
      expect(offlineEmbed.description).toContain(serverUrl);
    });

    it('should contain version in description if online', () => {
      expect(onlinePlayersEmbed.description).toContain(serverVersion);
      expect(onlineEmptyEmbed.description).toContain(serverVersion);
      expect(offlineEmbed.description).toBe(`Address: **${serverUrl}**`);
    });

    it('should show players in field if online and has players', () => {
      expect(onlinePlayersEmbed.fields.length).toBeGreaterThan(0);

      const playersField = onlinePlayersEmbed.fields[0];
      expect(playersField.name).toBe(
        `Players (${onlineWithPlayers.onlinePlayers})`
      );
      onlineWithPlayers.samplePlayers.forEach((player) => {
        expect(playersField.value).toContain(player.name);
      });

      expect(onlineEmptyEmbed.fields.length).toBe(0);
    });
  });

  describe('generateHelpEmbed', () => {
    it('should contain help text for commands', () => {
      const embed = embeds.generateHelpEmbed();
      expect(embed.fields.length).toBe(3);

      const setField = embed.fields.find((e) => e.name.includes(setCommand));
      expect(setField).toBeTruthy();
      expect(setField.value.length).toBeGreaterThan(0);

      const statusField = embed.fields.find((e) =>
        e.name.includes(statusCommand)
      );
      expect(statusField).toBeTruthy();
      expect(statusField.value.length).toBeGreaterThan(0);

      const announceField = embed.fields.find((e) =>
        e.name.includes(announceCommand)
      );
      expect(announceField).toBeTruthy();
      expect(announceField.value.length).toBeGreaterThan(0);
    });

    it('should only contain <url> for set command help', () => {
      const embed = embeds.generateHelpEmbed();

      embed.fields.forEach((field) => {
        const isSetCommand = field.name.includes(setCommand);
        expect(field.name.includes('<url>')).toBe(isSetCommand);
      });
    });
  });

  describe('generateSetFailureEmbed', () => {
    it('should contain no association copy as description', () => {
      const embed = embeds.generateSetFailureEmbed();
      expect(embed.description).toBe(
        `Usage: \`${setCommand} my.server.address\``
      );
    });
  });

  describe('generateSetSuccessEmbed', () => {
    const linkInfoTitle = 'Link information';

    it('should contain guild name in link information field', () => {
      const guildName = 'guild-name-here';
      const embed = embeds.generateSetSuccessEmbed(guildName, '');
      const field = embed.fields.find((e) => e.name === linkInfoTitle);
      expect(field.value).toContain(guildName);
    });

    it('should contain server url in link information field', () => {
      const serverUrl = 'server.host';
      const embed = embeds.generateSetSuccessEmbed('', serverUrl);
      const field = embed.fields.find((e) => e.name === linkInfoTitle);
      expect(field.value).toContain(serverUrl);
    });
  });

  describe('generateSetFailureEmbed', () => {
    it('should contain usage text', () => {
      const embed = embeds.generateSetFailureEmbed();
      expect(embed.description).toContain(`${setCommand} my.server.address`);
      expect(embed.fields[0]).toBeTruthy();
    });
  });

  describe('generateAnnounceNoAssociationEmbed', () => {
    it('should contain no association copy', () => {
      const embed = embeds.generateAnnounceNoAssociationEmbed();
      expect(embed.description).toBe(embeds.noAssociationCopy);
    });
  });

  describe('generateAnnounceSuccessEmbed', () => {
    it('should contain channel name', () => {
      const channelName = 'guild-name-here';
      const embed = embeds.generateAnnounceSuccessEmbed('', channelName);
      expect(embed.description).toContain(channelName);
    });

    it('should contain server url', () => {
      const serverUrl = 'server.host';
      const embed = embeds.generateAnnounceSuccessEmbed(serverUrl, '');
      expect(embed.description).toContain(serverUrl);
    });
  });
});
