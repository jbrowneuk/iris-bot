import { Personality } from '../interfaces/personality';

export class PersonalityCollection {
  static _instance: PersonalityCollection;

  public static get instance(): PersonalityCollection {
    if (!this._instance) {
      this._instance = new PersonalityCollection();
    }

    return this._instance;
  }

  private _personalities: Personality[];

  constructor() {
    this._personalities = [];
  }

  public addPersonality(personality: Personality): void {
    this._personalities.push(personality);
  }
}
