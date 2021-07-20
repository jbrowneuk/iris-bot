import { Message } from 'discord.js';
import * as nodeFetch from 'node-fetch';
import { Mock } from 'typemoq';

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

  fit('should fetch random word on +hangman-test command', (done) => {
    const mockWord = { word: 'word' };
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve(mockWord)
    };
    fetchSpy.and.returnValue(Promise.resolve(mockFetchResponse));

    const mockMessage = Mock.ofType<Message>();
    mockMessage.setup((s) => s.content).returns(() => '+hangman-test');

    personality.onMessage(mockMessage.object).then((response) => {
      expect(response).toBe(mockWord.word);
      done();
    });
  });
});
