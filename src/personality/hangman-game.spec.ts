import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';
import { Mock } from 'typemoq';

import { apiUrl, prefix, startCommand } from './constants/hangman-game';
import { HangmanGame } from './hangman-game';

describe('Hangman game', () => {
  let fetchSpy: jasmine.Spy;
  let personality: HangmanGame;

  beforeEach(() => {
    personality = new HangmanGame(null);
    fetchSpy = spyOn(nodeFetch, 'default');
  });

  it('should create', () => {
    expect(personality).toBeTruthy();
  });

  describe('help functionality', () => {
    it('should respond with help message', (done) => {
      personality.onHelp().then((response) => {
        expect(response).toBeTruthy();
        done();
      });
    });
  });

  it('should fetch random word on start command', (done) => {
    const mockWord = { word: 'word' };
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve(mockWord)
    };
    fetchSpy.and.returnValue(Promise.resolve(mockFetchResponse));

    const mockMessage = Mock.ofType<Message>();
    mockMessage
      .setup((s) => s.content)
      .returns(() => `${prefix} ${startCommand}`);

    personality.onMessage(mockMessage.object).then((response) => {
      expect(fetchSpy).toHaveBeenCalledWith(apiUrl);
      expect(response).toContain(mockWord.word);
      done();
    });
  });
});
