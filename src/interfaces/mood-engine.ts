export enum Mood {
  Positive = 'happy',
  Neutral = 'none',
  Negative = 'sad'
}

/**
 * Moodlet size descriptor
 */
export enum MoodletSize {
  Small,
  Medium,
  Large
}

/**
 * Encompasses a per-minute delta for a mood size change
 */
export interface MoodletDelta {
  sizeRepresentation: MoodletSize;
  delta: number;
}

export interface MoodEngine {
  /**
   * Gets the current mood representation, with a random chance to be neutral
   */
  getMood(): Mood;

  /**
   * Calculates a per-minute delta for a moodlet change
   *
   * @param size the total moodlet size descriptor
   * @param totalMinutes the total number of minutes to spread the moodlet over
   */
  calculateDelta(size: MoodletSize, totalMinutes: number): MoodletDelta;

  /**
   * Adds a moodlet delta to the overall mood
   *
   * @param mood the direction of the mood
   * @param delta the moodlet size delta to change by
   */
  addMoodlet(mood: Mood, amount: MoodletDelta): void;

  /**
   * Moves the mood value back toward neutral
   */
  neutraliseMood(): void;
}
