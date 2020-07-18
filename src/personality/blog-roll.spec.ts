import { Message, TextChannel } from 'discord.js';
import { readFileSync, unlink } from 'fs';
import * as nodeFetch from 'node-fetch';
import { IMock, It, Mock, Times } from 'typemoq';

import { Client } from '../interfaces/client';
import { DependencyContainer } from '../interfaces/dependency-container';
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

  public clearUpdateInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval as number);
      this.timerInterval = null;
    }
  }

  public invokeFetch(): void {
    this.fetchJournal();
  }
}

describe('Blog roll', () => {
  let mockDependencies: DependencyContainer;
  let personality: TestableBlogRoll;
  let mockClient: IMock<Client>;

  beforeEach(() => {
    mockClient = Mock.ofType<Client>();

    mockDependencies = {
      client: mockClient.object,
      database: null,
      engine: null,
      logger: console,
      responses: null,
      settings: null
    };
  });

  afterEach(() => {
    personality.clearUpdateInterval();
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

      personality.onAddressed(message.object, 'anything').then(value => {
        expect(value).toBeNull();
        done();
      });
    });
  });

  describe('onMessage', () => {
    beforeEach(() => {
      personality = new TestableBlogRoll(mockDependencies);
    });

    afterEach(done => {
      // Clean up test output file
      unlink(testOutputFile, err => {
        if (err && err.code !== 'ENOENT') {
          fail(err);
        }

        done();
      });
    });

    it('should cache channel when set channel command invoked', done => {
      const channelId = 'ABC1234567890';

      const channel = Mock.ofType<TextChannel>();
      channel.setup(c => c.id).returns(() => channelId);

      const message = Mock.ofType<Message>();
      message.setup(m => m.content).returns(() => '+set channel');
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
      message.setup(m => m.content).returns(() => '+set channel');
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

    beforeEach(() => {
      fetchSpy = spyOn(nodeFetch, 'default');
      personality = new TestableBlogRoll(mockDependencies);

      mockChannel = Mock.ofType<TextChannel>();

      mockClient
        .setup(c => c.findChannelById(It.isAny()))
        .returns(() => mockChannel.object);
    });

    it('should fetch journal data', () => {
      const mockResponse = {
        json: () => Promise.resolve({ posts: [] }),
        ok: true
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      expect(fetchSpy).toHaveBeenCalled();
      expect(fetchSpy.calls.first().args[0]).toContain('api/?posts');
    });

    it('should not send message if invalid response data', done => {
      const mockResponse = {
        json: () => Promise.resolve({}),
        ok: true
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny(), It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if response is not OK', done => {
      const mockResponse = {
        json: () => Promise.reject(),
        ok: false
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny(), It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if no posts', done => {
      const mockResponse = {
        json: () => Promise.resolve({ posts: [] }),
        ok: true
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny(), It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if first post ID is equal to cached value', done => {
      const postId = 123;
      personality.lastPost = postId;

      const mockResponse = {
        json: () => Promise.resolve({ posts: [{ postId }] }),
        ok: true
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny(), It.isAny()), Times.never());
        done();
      });
    });

    it('should not send message if new posts retrieved and no channel specified', done => {
      const mockResponse = {
        json: () =>
          Promise.resolve({
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
          }),
        ok: true
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isAny()), Times.never());
        mockChannel.verify(c => c.send(It.isAny(), It.isAny()), Times.never());
        done();
      });
    });

    it('should send message if new posts retrieved and channel specified', done => {
      const channelId = 'abc123';
      const mockResponse = {
        json: () =>
          Promise.resolve({
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
          }),
        ok: true
      };
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));
      personality.lastPost = 0;
      personality.channel = channelId;

      personality.invokeFetch();

      setTimeout(() => {
        expect().nothing();
        mockClient.verify(c => c.findChannelById(It.isValue(channelId)), Times.once());
        mockChannel.verify(c => c.send(It.isAny(), It.isAny()), Times.once());
        done();
      });
    });
  });
});
