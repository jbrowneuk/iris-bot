import * as axios from 'axios';
import { Message, MessageEmbed } from 'discord.js';
import { StatusCodes } from 'http-status-codes';
import { Mock } from 'typemoq';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { helpText, prefix, Stickers } from './stickers';

describe('Improved Discord stickers', () => {
  let fetchSpy: jest.SpyInstance;
  let personality: Stickers;

  beforeEach(() => {
    const mockLogger = Mock.ofType<Logger>();
    const mockDependencies = Mock.ofType<DependencyContainer>();
    mockDependencies.setup(s => s.logger).returns(() => mockLogger.object);
    personality = new Stickers(mockDependencies.object);
  });

  it('should not respond to addressed messages', done => {
    personality.onAddressed().then(response => {
      expect(response).toBeNull();
      done();
    });
  });

  describe('Sticker command', () => {
    beforeEach(() => {
      fetchSpy = jest.spyOn(axios.default, 'get');
    });

    it('should request sticker on command and post if found', done => {
      const mockSticker = 'http://localhost/sticker';
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => `${prefix}sticker`);

      const mockFetchResponse = {
        status: StatusCodes.OK,
        data: { name: 'any', url: mockSticker }
      };
      fetchSpy.mockReturnValue(Promise.resolve(mockFetchResponse));

      personality.onMessage(mockMessage.object).then(response => {
        expect(fetchSpy).toHaveBeenCalled();
        expect(response).toBe(mockSticker);
        done();
      });
    });

    it('should request sticker on command and respond if not found', done => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => `${prefix}sticker`);

      fetchSpy.mockReturnValue(Promise.reject('A rejection'));

      personality.onMessage(mockMessage.object).then(response => {
        expect(fetchSpy).toHaveBeenCalled();
        expect(response).toContain('Cannot find');
        done();
      });
    });

    it('should request sticker on command and respond if invalid data', done => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup(m => m.content).returns(() => `${prefix}sticker`);

      const mockFetchResponse = {
        status: StatusCodes.OK,
        data: 'text value'
      };
      fetchSpy.mockReturnValue(Promise.resolve(mockFetchResponse));

      personality.onMessage(mockMessage.object).then(response => {
        expect(fetchSpy).toHaveBeenCalled();
        expect(response).toContain('Cannot find');
        done();
      });
    });
  });

  describe('Help functionality', () => {
    it('should return embed with help text', done => {
      personality.onHelp().then(response => {
        const embed = response as MessageEmbed;
        expect(embed.description).toBe(helpText);
        done();
      });
    });
  });
});
