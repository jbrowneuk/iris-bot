import { Mood, MoodletDelta, MoodletSize } from '../interfaces/mood-engine';
import { MoodEngineImpl } from './mood-engine-impl';

describe('Mood engine', () => {
  describe('getMood', () => {
    it('should return positive or neutral when 100 ≥ mood > 0', () => {
      const tests = [
        { mood: 100, random: () => 0.9, result: Mood.Positive },
        { mood: 100, random: () => 0.5, result: Mood.Positive },
        { mood: 100, random: () => 0.1, result: Mood.Positive },
        { mood: 50, random: () => 0.9, result: Mood.Neutral },
        { mood: 50, random: () => 0.5, result: Mood.Neutral },
        { mood: 50, random: () => 0.1, result: Mood.Positive },
        { mood: 10, random: () => 0.9, result: Mood.Neutral },
        { mood: 10, random: () => 0.5, result: Mood.Neutral },
        { mood: 10, random: () => 0.1, result: Mood.Neutral }
      ];

      tests.forEach(test => {
        const moodEngine = new MoodEngineImpl(test.random);
        moodEngine.setMood(test.mood);

        const actual = moodEngine.getMood();

        expect(actual).withContext(`F: ${test.mood} with ${test.random()}`).toBe(test.result);
      });
    });

    it('should return negative or neutral when -100 ≤ mood < 0', () => {
      const tests = [
        { mood: -100, random: () => 0.9, result: Mood.Negative },
        { mood: -100, random: () => 0.5, result: Mood.Negative },
        { mood: -100, random: () => 0.1, result: Mood.Negative },
        { mood: -50, random: () => 0.9, result: Mood.Neutral },
        { mood: -50, random: () => 0.5, result: Mood.Neutral },
        { mood: -50, random: () => 0.1, result: Mood.Negative },
        { mood: -10, random: () => 0.9, result: Mood.Neutral },
        { mood: -10, random: () => 0.5, result: Mood.Neutral },
        { mood: -10, random: () => 0.1, result: Mood.Neutral }
      ];

      tests.forEach(test => {
        const moodEngine = new MoodEngineImpl(test.random);
        moodEngine.setMood(test.mood);

        const actual = moodEngine.getMood();

        expect(actual).withContext(`F: ${test.mood} with ${test.random()}`).toBe(test.result);
      });
    });

    it('should return neutral when mood is zero', () => {
      const tests = [
        { mood: 0, random: () => 0.9, result: Mood.Neutral },
        { mood: 0, random: () => 0.5, result: Mood.Neutral },
        { mood: 0, random: () => 0.1, result: Mood.Neutral }
      ];

      tests.forEach(test => {
        const moodEngine = new MoodEngineImpl(test.random);
        moodEngine.setMood(test.mood);

        const actual = moodEngine.getMood();

        expect(actual).withContext(`F: ${test.mood} with ${test.random()}`).toBe(test.result);
      });
    });
  });

  describe('addMoodlet', () => {
    let moodEngine: MoodEngineImpl;
    let magnitudes: MoodletDelta[];

    beforeEach(() => {
      const randomiser = () => 1;
      moodEngine = new MoodEngineImpl(randomiser);

      magnitudes = [
        { sizeRepresentation: MoodletSize.Small, delta: 1 },
        { sizeRepresentation: MoodletSize.Medium, delta: 2 },
        { sizeRepresentation: MoodletSize.Large, delta: 3 }
      ];
    });

    it('should add to mood value when moodlet is positive', () => {
      magnitudes.forEach(magnitude => {
        moodEngine.setMood(0);
        moodEngine.addMoodlet(Mood.Positive, magnitude);
        expect(moodEngine.getRawMood()).toBeGreaterThan(0);
      });
    });

    it('should subtract from mood value when moodlet is negative', () => {
      magnitudes.forEach(magnitude => {
        moodEngine.setMood(0);
        moodEngine.addMoodlet(Mood.Negative, magnitude);
        expect(moodEngine.getRawMood()).toBeLessThan(0);
      });
    });

    it('should neutralise mood value when moodlet is neutral and mood is positive', () => {
      magnitudes.forEach(magnitude => {
        const initialMood = 50;
        moodEngine.setMood(initialMood);
        moodEngine.addMoodlet(Mood.Neutral, magnitude);
        expect(moodEngine.getRawMood()).toBeLessThan(initialMood);
      });
    });

    it('should neutralise mood value when moodlet is neutral and mood is positive', () => {
      magnitudes.forEach(magnitude => {
        const initialMood = -50;
        moodEngine.setMood(initialMood);
        moodEngine.addMoodlet(Mood.Neutral, magnitude);
        expect(moodEngine.getRawMood()).toBeGreaterThan(initialMood);
      });
    });
  });

  describe('neutraliseMood', () => {
    let moodEngine: MoodEngineImpl;

    beforeEach(() => {
      const randomiser = () => 1;
      moodEngine = new MoodEngineImpl(randomiser);
    });

    it('should decrease magnitude of positive mood', () => {
      const initialMood = 50;
      moodEngine.setMood(initialMood);
      moodEngine.neutraliseMood();
      expect(moodEngine.getRawMood()).toBeLessThan(initialMood);
    });

    it('should decrease magnitude of negative mood', () => {
      const initialMood = -50;
      moodEngine.setMood(initialMood);
      moodEngine.neutraliseMood();
      expect(moodEngine.getRawMood()).toBeGreaterThan(initialMood);
    });

    it('should neutralise to zero value if small value', () => {
      moodEngine.setMood(0.001);
      moodEngine.neutraliseMood();
      expect(moodEngine.getRawMood()).toBeCloseTo(0, Number.EPSILON);

      moodEngine.setMood(-0.001);
      moodEngine.neutraliseMood();
      expect(moodEngine.getRawMood()).toBeCloseTo(0, Number.EPSILON);
    });
  });
});
