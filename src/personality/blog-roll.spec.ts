import * as axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Message, MessageOptions, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { IMock, It, Mock, Times } from 'typemoq';

import { COMMAND_PREFIX } from '../constants/personality-constants';
import { PostData, PostWrapper } from '../interfaces/blog-roll';
import { Client } from '../interfaces/client';
import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Engine } from '../interfaces/engine';
import { Logger } from '../interfaces/logger';
import { ResponseGenerator } from '../interfaces/response-generator';
import { Settings } from '../interfaces/settings';
import { BlogRoll, blogRollApiPath, blogRollSiteRoot } from './blog-roll';

jest.mock('fs', () => ({
  readFile: (path, opts, callback) => {
    if (path === 'init-test') {
      return callback(null, '{ "channelId": "1", "lastPostId": 200 }');
    }

    callback(null, null);
  },
  writeFile: jest.fn().mockImplementation((path, data, opts, callback) => callback())
}));

const testOutputFile = 'blog-roll.test.json';

class TestableBlogRoll extends BlogRoll {
  get updateInterval(): number | NodeJS.Timer {
    return this.timerInterval;
  }

  get channel(): string {
    return this.channelId;
  }

  set channel(value: string) {
    this.channelId = value;
  }

  get lastPost(): number {
    return this.lastPostId;
  }

  set lastPost(value: number) {
    this.lastPostId = value;
  }

  constructor(dependencies: DependencyContainer, pathOverride?: string) {
    if (typeof pathOverride === 'undefined') {
      pathOverride = testOutputFile;
    }

    super(dependencies, pathOverride);
  }

  public invokeFetch() {
    return this.fetchJournal();
  }
}

describe('Blog roll', () => {
  let mockClient: IMock<Client>;
  let mockLogger: IMock<Logger>;
  let mockDependencies: DependencyContainer;
  let personality: TestableBlogRoll;
  const mock = new MockAdapter(axios as any);

  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    mockClient = Mock.ofType<Client>();
    mockLogger = Mock.ofType<Logger>();

    mockDependencies = {
      client: mockClient.object,
      database: Mock.ofType<Database>().object,
      engine: Mock.ofType<Engine>().object,
      logger: mockLogger.object,
      responses: Mock.ofType<ResponseGenerator>().object,
      settings: Mock.ofType<Settings>().object
    };
  });

  afterEach(() => {
    personality.destroy();
    mock.reset();
  });

  describe('Initialisation', () => {
    const testInputFile = 'init-test';

    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies, testInputFile);
    });

    it('should read configuration on initialise', done => {
      expect(personality.lastPost).toBe(0);
      expect(personality.channel).toBeFalsy();

      personality.initialise();

      // Parsing happens in a callback, so need setTimeout and advancing of timers
      setTimeout(() => {
        expect(personality.lastPost).not.toBe(0);
        expect(personality.channel).toBeTruthy();
        done();
      });

      jest.advanceTimersByTime(10);
    });

    it('should set interval timer on initialise', done => {
      expect(personality.updateInterval).toBeFalsy();

      personality.initialise();

      // Parsing happens in a callback, so need setTimeout and advancing of timers
      setTimeout(() => {
        expect(personality.updateInterval).toBeTruthy();
        done();
      });

      jest.advanceTimersByTime(10);
    });
  });

  describe('onAddressed', () => {
    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies);
    });

    it('should resolve to null', done => {
      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => 'anything');

      personality.onAddressed().then(value => {
        expect(value).toBeNull();
        done();
      });
    });
  });

  describe('onMessage', () => {
    const channelId = 'ABC1234567890';

    let channel: IMock<TextChannel>;
    let message: IMock<Message>;

    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies);

      channel = Mock.ofType();
      channel.setup(c => c.id).returns(() => channelId);

      message = Mock.ofType();
      message.setup(m => m.channel).returns(() => channel.object);
    });

    it('should cache channel when set channel command invoked', () => {
      const saveSpy = jest.spyOn(personality as any, 'saveSettings').mockImplementation(() => null);
      message.setup(m => m.content).returns(() => COMMAND_PREFIX + 'set channel');

      personality.onMessage(message.object);

      expect(personality.channel).toBe(channelId);
      expect(saveSpy).toHaveBeenCalled();

      saveSpy.mockRestore();
    });

    it('should write config when set channel command invoked', () => {
      const writeSpy = jest.spyOn(fs, 'writeFile');

      message.setup(m => m.content).returns(() => COMMAND_PREFIX + 'set channel');

      personality.onMessage(message.object);

      expect(writeSpy).toHaveBeenCalled();
      expect(writeSpy.mock.calls[0][1]).toContain(`"channelId":"${channelId}"`);
    });
  });

  describe('Fetch Journal data', () => {
    let mockChannel: IMock<TextChannel>;
    let messageData: string | MessageOptions;

    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies);

      mockChannel = Mock.ofType<TextChannel>();
      mockChannel.setup(m => m.send(It.isAny())).callback(data => (messageData = data));

      mockClient.setup(c => c.findChannelById(It.isAny())).returns(() => mockChannel.object);
    });

    it('should fetch journal data', () => {
      const mockResponse: PostWrapper = { posts: [] };

      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.Ok, mockResponse);
      const getSpy = jest.spyOn(axios.default, 'get');

      personality.invokeFetch();

      expect(getSpy).toHaveBeenCalled();
      getSpy.mockRestore();
    });

    it('should not send message if invalid response data', () => {
      const mockResponse = {
        anything: [1, 2, 3, 4]
      };
      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.Ok, mockResponse);
      const getSpy = jest.spyOn(axios.default, 'get');

      personality.invokeFetch();

      mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
      mockChannel.verify(c => c.send(It.isAny()), Times.never());

      getSpy.mockRestore();
    });

    it('should not send message if response is not OK', () => {
      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.NotFound);
      const getSpy = jest.spyOn(axios.default, 'get');

      personality.invokeFetch();

      mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
      mockChannel.verify(c => c.send(It.isAny()), Times.never());

      getSpy.mockRestore();
    });

    it('should not send message if no posts', () => {
      const mockResponse: PostWrapper = { posts: [] };
      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.Ok, mockResponse);
      const getSpy = jest.spyOn(axios.default, 'get');

      personality.invokeFetch();

      mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
      mockChannel.verify(c => c.send(It.isAny()), Times.never());

      getSpy.mockRestore();
    });

    it('should not send message if first post ID is equal to cached value', () => {
      const postId = 123;
      personality.lastPost = postId;

      const mockResponse: PostWrapper = { posts: [{ postId } as PostData] };
      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.Ok, mockResponse);
      const getSpy = jest.spyOn(axios.default, 'get');

      personality.invokeFetch();

      mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
      mockChannel.verify(c => c.send(It.isAny()), Times.never());

      getSpy.mockRestore();
    });

    it('should not send message if new posts retrieved and no channel specified', done => {
      const mockResponse: PostWrapper = {
        posts: [
          {
            content: 'test',
            date: 1234566,
            postId: 123,
            slug: 'test',
            tags: [],
            title: 'test'
          }
        ]
      };
      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.Ok, mockResponse);
      const getSpy = jest.spyOn(axios.default, 'get');

      personality.invokeFetch().then(() => {
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny()), Times.never());

        getSpy.mockRestore();

        done();
      });
    });

    it('should send message if new posts retrieved and channel specified', done => {
      const channelId = 'abc123';
      const mockResponse: PostWrapper = {
        posts: [
          {
            content: 'test',
            date: 1234566,
            postId: 123,
            slug: 'test',
            tags: [],
            title: 'test'
          }
        ]
      };
      mock.onGet(blogRollSiteRoot + blogRollApiPath).reply(axios.HttpStatusCode.Ok, mockResponse);
      const getSpy = jest.spyOn(axios.default, 'get');
      personality.lastPost = 0;
      personality.channel = channelId;

      personality.invokeFetch().then(() => {
        mockClient.verify(c => c.findChannelById(It.isValue(channelId)), Times.once());
        mockChannel.verify(c => c.send(It.isAny()), Times.once());

        if (typeof messageData === 'string') {
          fail('MessageData was a sting');
          return;
        }

        const typed = messageData as MessageOptions;
        expect(typed.content).toContain('New post');
        expect(typed.embeds).toBeTruthy();

        getSpy.mockRestore();
        done();
      });
    });
  });
});
