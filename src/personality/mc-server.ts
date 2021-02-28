import { Personality } from '../interfaces/personality';
import { MessageType } from '../types';

export class McServer implements Personality {
  public onAddressed(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  public onMessage(): Promise<MessageType> {
    return Promise.resolve(null);
  }

  onHelp(): Promise<MessageType> {
    return Promise.resolve(null);
  }
}
