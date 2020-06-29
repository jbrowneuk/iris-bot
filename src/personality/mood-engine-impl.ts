import { Mood, MoodEngine, MoodletSize } from '../interfaces/mood-engine';

const maxMood = 100;

const moodletAmounts = new Map<MoodletSize, [number, number]>();
moodletAmounts.set(MoodletSize.Small, [1, 10]);
moodletAmounts.set(MoodletSize.Medium, [11, 20]);
moodletAmounts.set(MoodletSize.Large, [21, 30]);

export class MoodEngineImpl implements MoodEngine {
  private moodValue: number;

  constructor(private randomiser?: () => number) {
    this.moodValue = 0;
    if (!randomiser) {
      this.randomiser = Math.random;
    }
  }

  /**
   * Gets the current mood representation, with a random chance to be neutral
   */
  public getMood(): Mood {
    const moodScaled = this.moodValue / maxMood;

    // High random rolls produce a neutral mood
    const isNeutral = this.randomiser() >= Math.abs(moodScaled);
    if (isNeutral) {
      return Mood.Neutral;
    }

    return this.moodValue > 0 ? Mood.Positive : Mood.Negative;
  }

  public addMoodlet(mood: Mood, amount: MoodletSize): void {
    const moodSize = this.generateMoodletSize(amount);
    this.adjustMoodValue(mood, moodSize);
    this.constrainMoodValue();
  }

  public neutraliseMood(): void {
    this.moodValue *= 0.95;
    this.constrainMoodValue();
  }

  public setMood(value: number): void {
    this.moodValue = value;
  }

  public getRawMood(): number {
    return this.moodValue;
  }

  private constrainMoodValue(): void {
    if (this.moodValue > maxMood) {
      this.moodValue = maxMood;
    }

    if (this.moodValue < -maxMood) {
      this.moodValue = -maxMood;
    }

    const abs = Math.abs(this.moodValue);
    if (abs < 1) {
      this.moodValue = 0;
    }
  }

  /**
   * Generates a numeric value from a moodlet size value
   *
   * @param size the moodlet size enum value
   */
  private generateMoodletSize(size: MoodletSize): number {
    const [lower, upper] = moodletAmounts.get(size);
    const range = upper - lower;
    return Math.ceil(this.randomiser() * range + lower);
  }

  private adjustMoodValue(mood: Mood, amount: number): void {
    let sign;
    if (mood === Mood.Neutral) {
      const abs = Math.abs(this.moodValue);

      // Too close to zero or will overshoot, set to zero
      if (abs < 1 || amount > abs) {
        this.moodValue = 0;
        return;
      }

      sign = -Math.sign(this.moodValue);
    } else {
      sign = mood === Mood.Positive ? 1 : -1;
    }

    this.moodValue += amount * sign;
  }
}
