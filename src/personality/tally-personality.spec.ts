import { Guild, Message } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { Logger } from '../interfaces/logger';
import {
  addCommand,
  collection,
  resetCountCommand,
  TallyPersonality,
  totalCountCommand
} from './tally-personality';

const mockGuildId = 'MOCK-GUILD';

describe('Tally functionality', () => {
  let mockDatabase: IMock<Database>;
  let mockLogger: IMock<Logger>;
  let mockMessage: IMock<Message>;

  let personality: TallyPersonality;

  beforeEach(() => {
    mockDatabase = Mock.ofType<Database>();
    mockLogger = Mock.ofType<Logger>();

    const mockDependencies = {
      database: mockDatabase.object,
      logger: mockLogger.object
    } as DependencyContainer;

    personality = new TallyPersonality(mockDependencies);
  });

  describe('Addressed message response', () => {
    it('should return a Promise that resolves to null', (done) => {
      personality.onAddressed().then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('Adding to the tally behaviour', () => {
    beforeEach(() => {
      const mockGuild = Mock.ofType<Guild>();
      mockGuild.setup((m) => m.id).returns(() => mockGuildId);

      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => addCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);
    });

    it('should create a record for the guild if it doesn’t exist', (done) => {
      mockDatabase
        .setup((m) => m.getRecordsFromCollection(It.isAny(), It.isAny()))
        .returns(() => Promise.resolve([]));

      mockDatabase
        .setup((m) =>
          m.insertRecordsToCollection(It.isValue(collection), It.isAny())
        )
        .returns(() => Promise.resolve());

      personality.onMessage(mockMessage.object).then(() => {
        mockDatabase.verify(
          (m) =>
            m.insertRecordsToCollection(
              It.isValue(collection),
              It.isObjectWith({ guildId: mockGuildId })
            ),
          Times.once()
        );
        done();
      });
    });

    it('should update the record for the guild if it exists', (done) => {
      const initialCount = 4;

      mockDatabase
        .setup((m) => m.getRecordsFromCollection(It.isAny(), It.isAny()))
        .returns(() => Promise.resolve([{ count: initialCount }]));

      mockDatabase
        .setup((m) =>
          m.updateRecordsInCollection(
            It.isValue(collection),
            It.isAny(),
            It.isAny()
          )
        )
        .returns(() => Promise.resolve());

      personality.onMessage(mockMessage.object).then(() => {
        mockDatabase.verify(
          (m) =>
            m.updateRecordsInCollection(
              It.isValue(collection),
              It.isObjectWith({ $count: initialCount + 1 }),
              It.isObjectWith({ $guildId: mockGuildId })
            ),
          Times.once()
        );
        done();
      });
    });
  });

  describe('Reset tally behaviour', () => {
    beforeEach(() => {
      const mockGuild = Mock.ofType<Guild>();
      mockGuild.setup((m) => m.id).returns(() => mockGuildId);

      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => resetCountCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);
    });

    it('should do nothing if the guild record doesn’t exist', (done) => {
      mockDatabase
        .setup((m) => m.getRecordsFromCollection(It.isAny(), It.isAny()))
        .returns(() => Promise.resolve([]));

      personality.onMessage(mockMessage.object).then(() => {
        mockDatabase.verify(
          (m) =>
            m.updateRecordsInCollection(
              It.isValue(collection),
              It.isAny(),
              It.isAny()
            ),
          Times.never()
        );
        done();
      });
    });

    it('should update the record for the guild if it exists', (done) => {
      mockDatabase
        .setup((m) => m.getRecordsFromCollection(It.isAny(), It.isAny()))
        .returns(() => Promise.resolve([{ count: 64 }]));

      mockDatabase
        .setup((m) =>
          m.updateRecordsInCollection(
            It.isValue(collection),
            It.isAny(),
            It.isAny()
          )
        )
        .returns(() => Promise.resolve());

      personality.onMessage(mockMessage.object).then(() => {
        mockDatabase.verify(
          (m) =>
            m.updateRecordsInCollection(
              It.isValue(collection),
              It.isObjectWith({ $count: 0 }),
              It.isObjectWith({ $guildId: mockGuildId })
            ),
          Times.once()
        );
        done();
      });
    });
  });

  describe('Get tally behaviour', () => {
    beforeEach(() => {
      const mockGuild = Mock.ofType<Guild>();
      mockGuild.setup((m) => m.id).returns(() => mockGuildId);

      mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => totalCountCommand);
      mockMessage.setup((m) => m.guild).returns(() => mockGuild.object);
    });

    it('should resolve to Zero if the guild record doesn’t exist', (done) => {
      mockDatabase
        .setup((m) => m.getRecordsFromCollection(It.isAny(), It.isAny()))
        .returns(() => Promise.resolve([]));

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toBe('Zero');
        done();
      });
    });

    it('should resolve to string containing count if the guild record doesn’t exist', (done) => {
      const count = 64;
      mockDatabase
        .setup((m) => m.getRecordsFromCollection(It.isAny(), It.isAny()))
        .returns(() => Promise.resolve([{ count }]));

      personality.onMessage(mockMessage.object).then((response) => {
        expect(response).toContain(`${count}`);
        done();
      });
    });
  });
});
