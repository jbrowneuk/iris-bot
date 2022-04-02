import * as axios from 'axios';
import { Message, MessageOptions, TextChannel } from 'discord.js';
import { readFileSync, unlink } from 'fs';
import { StatusCodes } from 'http-status-codes';
import { IMock, It, Mock, Times } from 'typemoq';

import { COMMAND_PREFIX } from '../constants/personality-constants';
import { PostData, PostWrapper } from '../interfaces/blog-roll';
import { Client } from '../interfaces/client';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import { BlogRoll } from './blog-roll';

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

  public invokeFetch(): void {
    this.fetchJournal();
  }
}

type MockResponseType = Partial<axios.AxiosResponse<PostWrapper>>;

describe('Blog roll', () => {
  let mockClient: IMock<Client>;
  let mockLogger: IMock<Logger>;
  let mockDependencies: DependencyContainer;
  let personality: TestableBlogRoll;

  beforeEach(() => {
    mockClient = Mock.ofType<Client>();
    mockLogger = Mock.ofType<Logger>();

    mockDependencies = {
      client: mockClient.object,
      database: null,
      engine: null,
      logger: mockLogger.object,
      responses: null,
      settings: null
    };
  });

  afterEach(done => {
    personality.destroy();

    // Clean up test output file
    unlink(testOutputFile, err => {
      if (err && err.code !== 'ENOENT') {
        fail(err);
      }

      done();
    });
  });

  describe('Initialisation', () => {
    const testInputFile = './spec/mocks/blog-roll.mock.json';

    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies, testInputFile);
    });

    it('should read configuration on initialise', done => {
      expect(personality.lastPost).toBe(0);
      expect(personality.channel).toBeFalsy();

      personality.initialise();

      setTimeout(() => {
        expect(personality.lastPost).not.toBe(0);
        expect(personality.channel).toBeTruthy();
        done();
      }, 200);
    });

    it('should set interval timer on initialise', done => {
      expect(personality.updateInterval).toBeFalsy();

      personality.initialise();

      setTimeout(() => {
        expect(personality.updateInterval).not.toBe(0);
        done();
      });
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
    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies);
    });

    it('should cache channel when set channel command invoked', done => {
      const channelId = 'ABC1234567890';

      const channel = Mock.ofType<TextChannel>();
      channel.setup(c => c.id).returns(() => channelId);

      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => COMMAND_PREFIX + 'set channel');
      message.setup(m => m.channel).returns(() => channel.object);

      const saveSpy = spyOn(personality as any, 'saveSettings');

      personality.onMessage(message.object).then(() => {
        expect(personality.channel).toBe(channelId);
        expect(saveSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should write config when set channel command invoked', done => {
      const channelId = 'ABC1234567890';

      const channel = Mock.ofType<TextChannel>();
      channel.setup(c => c.id).returns(() => channelId);

      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => COMMAND_PREFIX + 'set channel');
      message.setup(m => m.channel).returns(() => channel.object);

      personality.onMessage(message.object);

      setTimeout(() => {
        const fileContents = readFileSync(testOutputFile, 'utf-8');
        const parsed = JSON.parse(fileContents);
        expect(parsed.channelId).toBe(channelId);
        done();
      }, 200);
    });
  });

  describe('Fetch Journal data', () => {
    let fetchSpy: jasmine.Spy;
    let mockChannel: IMock<TextChannel>;
    let messageData: string | MessageOptions;

    beforeEach(() => {
      fetchSpy = spyOn(axios.default, 'get');
      personality = new TestableBlogRoll(mockDependencies);

      mockChannel = Mock.ofType<TextChannel>();
      mockChannel.setup(m => m.send(It.isAny())).callback(data => (messageData = data));

      mockClient.setup(c => c.findChannelById(It.isAny())).returns(() => mockChannel.object);
    });

    it('should fetch journal data', () => {
      const mockResponse: MockResponseType = {
        data: { posts: [] },
        status: StatusCodes.OK
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      expect(fetchSpy).toHaveBeenCalled();
      expect(fetchSpy.calls.first().args[0]).toContain('api/?posts');
    });

    it('should not send message if invalid response data', done => {
      const mockResponse = {
        data: {},
        status: StatusCodes.OK
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if response is not OK', done => {
      const mockResponse: MockResponseType = {
        data: { posts: [] },
        status: StatusCodes.NOT_FOUND
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if no posts', done => {
      const mockResponse: MockResponseType = {
        data: { posts: [] },
        status: StatusCodes.OK
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if first post ID is equal to cached value', done => {
      const postId = 123;
      personality.lastPost = postId;

      const mockResponse: MockResponseType = {
        data: { posts: [{ postId } as PostData] },
        status: StatusCodes.OK
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if new posts retrieved and no channel specified', done => {
      const mockResponse: MockResponseType = {
        data: {
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
        },
        status: StatusCodes.OK
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny()), Times.never());
        done();
      });
    });

    it('should send message if new posts retrieved and channel specified', done => {
      const channelId = 'abc123';
      const mockResponse: MockResponseType = {
        data: {
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
        },
        status: StatusCodes.OK
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));
      personality.lastPost = 0;
      personality.channel = channelId;

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isValue(channelId)), Times.once());
        mockChannel.verify(c => c.send(It.isAny()), Times.once());

        if (typeof messageData === 'string') {
          fail('MessageData was a sting');
          return;
        }

        const typed = messageData as MessageOptions;
        expect(typed.content).toContain('New post');
        expect(typed.embeds).toBeTruthy();
        done();
      });
    });
  });
});
