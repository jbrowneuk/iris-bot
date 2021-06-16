import { announceCommand, setCommand, statusCommand } from '../constants/mc-server';
import * as embeds from './mc-server';

describe('Embed formatting for Minecraft server utilities', () => {
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
      expect(embed.description).toBe(embeds.noAssociationCopy);
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
