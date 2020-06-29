export enum Mood {
  Positive = 'happy',
  Neutral = 'none',
  Negative = 'sad'
}

export enum MoodletSize {
  Small,
  Medium,
  Large
}

export interface MoodEngine {
  getMood(): Mood;

  addMoodlet(mood: Mood, amount: MoodletSize): void;

  neutraliseMood(): void;
}
