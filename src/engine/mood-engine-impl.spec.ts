import { Mood, MoodletDelta, MoodletSize } from '../interfaces/mood-engine';
import { MoodEngineImpl } from './mood-engine-impl';

describe('Mood engine', () => {
  describe('getMood', () => {
    const positiveTests: [Mood, number, number][] = [
      [Mood.Positive, 100, 0.9],
      [Mood.Positive, 100, 0.5],
      [Mood.Positive, 100, 0.1],
      [Mood.Neutral, 50, 0.9],
      [Mood.Neutral, 50, 0.5],
      [Mood.Positive, 50, 0.1],
      [Mood.Neutral, 10, 0.9],
      [Mood.Neutral, 10, 0.5],
      [Mood.Neutral, 10, 0.1]
    ];
    const negativeTests: [Mood, number, number][] = [
      [Mood.Negative, -100, 0.9],
      [Mood.Negative, -100, 0.5],
      [Mood.Negative, -100, 0.1],
      [Mood.Neutral, -50, 0.9],
      [Mood.Neutral, -50, 0.5],
      [Mood.Negative, -50, 0.1],
      [Mood.Neutral, -10, 0.9],
      [Mood.Neutral, -10, 0.5],
      [Mood.Neutral, -10, 0.1]
    ];
    const neutralTests: [Mood, number, number][] = [
      [Mood.Neutral, 0, 0.9],
      [Mood.Neutral, 0, 0.5],
      [Mood.Neutral, 0, 0.1]
    ];

    test.each([...positiveTests, ...negativeTests, ...neutralTests])('should return %s when mood is %i and RNG returns %f', (result, mood, rng) => {
      const moodEngine = new MoodEngineImpl(() => rng);
      moodEngine.setMood(mood);

      const actual = moodEngine.getMood();

      expect(actual).toBe(result);
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
