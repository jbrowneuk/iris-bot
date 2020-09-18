import { ActivityType, Message } from 'discord.js';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Mood, MoodEngine, MoodletDelta, MoodletSize } from '../interfaces/mood-engine';
import { Personality } from '../interfaces/personality';
import { getValueStartedWith, randomFloat, randomInteger } from '../utils';

const defaultInterval = 1000 * 60; // Fires every minute
const activityStartThreshold = 0.25; // TODO: adjust this based on mood/eagerness

export interface BotActivity {
  name: string;
  active: boolean;
  activityType: ActivityType | null;
  moodlet: Mood;
  size: MoodletSize;
  minMinutes: number;
  maxMinutes: number;
}

const activities: BotActivity[] = [
  {
    name: 'music',
    active: false,
    activityType: 'LISTENING',
    moodlet: Mood.Positive,
    size: MoodletSize.Small,
    minMinutes: 3,
    maxMinutes: 30
  },
  {
    name: 'movies',
    active: false,
    activityType: null,
    moodlet: Mood.Positive,
    size: MoodletSize.Large,
    minMinutes: 60,
    maxMinutes: 90
  },
  {
    name: 'puzzles',
    active: true,
    activityType: 'PLAYING',
    moodlet: Mood.Positive,
    size: MoodletSize.Medium,
    minMinutes: 15,
    maxMinutes: 60
  }
];

export const moodSummaryCommands = [
  'how are you',
  'how do you feel',
  "what's up",
  "how's life"
];

export class MoodControl implements Personality {
  protected timerInterval: number | NodeJS.Timer;
  protected activity: BotActivity;
  protected activityDelta: MoodletDelta;
  protected activityEnd: Date;

  constructor(
    private dependencies: DependencyContainer,
    private moodEngine: MoodEngine
  ) {
    this.activity = null;
  }

  public initialise(): void {
    this.timerInterval = setInterval(
      this.activityUpdate.bind(this),
      defaultInterval
    );
  }

  public destroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval as number);
      this.timerInterval = null;
    }
  }

  public onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<string> {
    const startsWithCommand = getValueStartedWith(addressedMessage, moodSummaryCommands);
    if (!startsWithCommand) {
      return Promise.resolve(null);
    }

    return this.dependencies.responses.generateResponse('mood');
  }

  public onMessage(message: Message): Promise<string> {
    return Promise.resolve(null);
  }

  protected activityUpdate(): void {
    if (this.activity !== null) {
      return this.sustainActivity();
    }

    const activityChance = randomFloat(0, 1);
    if (activityChance > activityStartThreshold) {
      return this.beginActivity();
    }

    this.moodEngine.neutraliseMood();
  }

  protected beginActivity(): void {
    const positiveActs = activities.filter(a => a.moodlet === Mood.Positive); // TODO passive & active
    const activityChoice = randomInteger(0, positiveActs.length);
    this.activity = positiveActs[activityChoice];

    // Calculate delta and time until end
    const mins = randomInteger(
      this.activity.minMinutes,
      this.activity.maxMinutes
    );
    const timeMsec = mins * 60 * 1000;
    this.activityEnd = new Date(Date.now() + timeMsec);
    this.activityDelta = this.moodEngine.calculateDelta(
      this.activity.size,
      mins
    );

    // Set presence
    if (this.activity.activityType !== null) {
      const presence = {
        activity: { name: this.activity.name, type: this.activity.activityType }
      };
      this.dependencies.client.setPresence(presence);
    }
  }

  protected sustainActivity(): void {
    const currentTime = new Date();
    if (currentTime > this.activityEnd) {
      this.activity = null;
      this.dependencies.client.setPresence({});
      return;
    }

    this.moodEngine.addMoodlet(this.activity.moodlet, this.activityDelta);
  }
}
