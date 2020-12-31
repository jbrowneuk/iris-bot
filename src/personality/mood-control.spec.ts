import { Message } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import { Client } from '../interfaces/client';
import { DependencyContainer } from '../interfaces/dependency-container';
import {
  Mood,
  MoodEngine,
  MoodletDelta,
  MoodletSize
} from '../interfaces/mood-engine';
import { ResponseGenerator } from '../interfaces/response-generator';
import * as utils from '../utils';
import { BotActivity, MoodControl, moodSummaryCommands } from './mood-control';

class TestableMoodControl extends MoodControl {
  public get currentActivityDetails(): {
    activity: BotActivity;
    delta: MoodletDelta;
    end: Date;
  } {
    return {
      activity: this.activity,
      delta: this.activityDelta,
      end: this.activityEnd
    };
  }

  public get hasTimer(): boolean {
    return !!this.timerInterval;
  }

  public runActivityUpdate(): void {
    this.activityUpdate();
  }

  public runBeginActivity(): void {
    this.beginActivity();
  }

  public runSustainActivity(): void {
    this.sustainActivity();
  }

  public mockActivity(timeEnd: Date): void {
    this.activity = {
      name: 'mock',
      active: false,
      activityType: null,
      moodlet: Mood.Positive,
      size: MoodletSize.Medium,
      minMinutes: 1,
      maxMinutes: 10
    };

    this.activityDelta = {
      sizeRepresentation: MoodletSize.Medium,
      delta: 1
    };

    this.activityEnd = timeEnd;
  }
}

const mockResponse = 'mock-response';

describe('Mood control', () => {
  let mockDependencies: DependencyContainer;
  let mockClient: IMock<Client>;
  let mockResponses: IMock<ResponseGenerator>;
  let mockMoodEngine: IMock<MoodEngine>;
  let moodControl: TestableMoodControl;

  beforeEach(() => {
    mockClient = Mock.ofType<Client>();
    mockMoodEngine = Mock.ofType<MoodEngine>();
    mockResponses = Mock.ofType<ResponseGenerator>();
    mockResponses
      .setup((r) => r.generateResponse(It.isAny()))
      .returns(() => Promise.resolve(mockResponse));

    mockDependencies = {
      client: mockClient.object,
      database: null,
      engine: null,
      logger: console,
      responses: mockResponses.object,
      settings: null
    };

    moodControl = new TestableMoodControl(
      mockDependencies,
      mockMoodEngine.object
    );
  });

  afterEach(() => {
    moodControl.destroy();
  });

  describe('Initialisation', () => {
    it('should initialise interval timer', () => {
      expect(moodControl.hasTimer).toBeFalse();
      moodControl.initialise();
      expect(moodControl.hasTimer).toBeTrue();
    });
  });

  describe('onMessage interaction', () => {
    it('should return promise resolving to null', (done) => {
      const mockMessage = Mock.ofType<Message>();
      mockMessage.setup((m) => m.content).returns(() => 'any message');

      moodControl.onMessage(mockMessage.object).then((value) => {
        expect(value).toBeNull();
        done();
      });
    });
  });

  describe('onAddressed interaction', () => {
    moodSummaryCommands.forEach((command) => {
      it(`should respond to “${command}” when addressed`, (done) => {
        moodControl.onAddressed(null, command).then((response) => {
          expect(response).toBe(mockResponse);
          done();
        });
      });
    });

    it('should return promise resolving to null if no interaction', (done) => {
      moodControl.onAddressed(null, 'nothing').then((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('beginActivity', () => {
    beforeEach(() => {
      spyOn(utils, 'randomFloat').and.callFake((min, max) => min);
      spyOn(utils, 'randomInteger').and.callFake((min, max) => min);

      mockMoodEngine
        .setup((s) => s.calculateDelta(It.isAny(), It.isAny()))
        .returns(() => ({ sizeRepresentation: null, delta: 1 }));
    });

    it('should set an activity', () => {
      expect(moodControl.currentActivityDetails.activity).toBeFalsy();
      moodControl.runBeginActivity();
      expect(moodControl.currentActivityDetails.activity).toBeTruthy();
    });

    it('should set an activity end time', () => {
      expect(moodControl.currentActivityDetails.end).toBeFalsy();
      moodControl.runBeginActivity();

      const endDate = moodControl.currentActivityDetails.end;
      expect(endDate).toBeTruthy();
      expect(endDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should set an activity moodlet delta', () => {
      expect(moodControl.currentActivityDetails.delta).toBeFalsy();
      moodControl.runBeginActivity();

      const delta = moodControl.currentActivityDetails.delta;
      expect(delta).toBeTruthy();
      expect(delta.delta).toBeGreaterThan(0);
    });

    it('should set presence based on activity', () => {
      // Caveat: first activity needs to have a type
      // TODO: allow activity list to be customised by tests
      moodControl.runBeginActivity();

      expect(moodControl.currentActivityDetails.activity).toBeTruthy();
      mockClient.verify((m) => m.setPresence(It.isAny()), Times.once());
    });
  });

  describe('sustainActivity', () => {
    it('should send moodlet delta to mood engine if activity sustained', () => {
      moodControl.mockActivity(new Date(Date.now() + 60000));
      const expectedActivity = moodControl.currentActivityDetails;

      moodControl.runSustainActivity();

      mockMoodEngine.verify(
        (m) =>
          m.addMoodlet(
            It.isValue(expectedActivity.activity.moodlet),
            It.isValue(expectedActivity.delta)
          ),
        Times.once()
      );
      expect().nothing();
    });

    it('should reset presence if activity ends', () => {
      moodControl.mockActivity(new Date(Date.now() - 60000));

      moodControl.runSustainActivity();

      const actualActivity = moodControl.currentActivityDetails;
      expect(actualActivity.activity).toBeNull();
      mockClient.verify((m) => m.setPresence(It.isValue({})), Times.once());
    });
  });

  describe('activityUpdate', () => {
    it('should sustain activity if it has one', () => {
      // Stub out the sustain activity to prevent it running
      const sustainSpy = spyOn(moodControl as any, 'sustainActivity');

      // Mock a high threshold
      moodControl.mockActivity(new Date());

      moodControl.runActivityUpdate();

      expect(sustainSpy).toHaveBeenCalled();
    });

    it('should start activity if it has none and value above threshold', () => {
      // Stub out the begin activity to prevent it running
      const beginSpy = spyOn(moodControl as any, 'beginActivity');
      spyOn(utils, 'randomFloat').and.returnValue(0.9);

      moodControl.runActivityUpdate();

      expect(beginSpy).toHaveBeenCalled();
    });

    it('should neutralise mood if it has no activity and value below threshold', () => {
      // Mock a low threshold
      spyOn(utils, 'randomFloat').and.returnValue(0.1);

      moodControl.runActivityUpdate();

      mockMoodEngine.verify((m) => m.neutraliseMood(), Times.once());
      expect().nothing();
    });
  });
});
