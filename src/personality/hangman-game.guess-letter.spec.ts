import { Guild, Message, MessageEmbed, MessageOptions } from 'discord.js';
import { IMock, It, Mock, Times } from 'typemoq';

import { Database } from '../interfaces/database';
import { DependencyContainer } from '../interfaces/dependency-container';
import { KeyedObject } from '../interfaces/keyed-object';
import { Logger } from '../interfaces/logger';
import { guessCommand, prefix, sqlCollection } from './constants/hangman-game';
import * as embeds from './embeds/hangman-game';
import { HangmanGame } from './hangman-game';
import { mockActiveGame, mockGuildId } from './hangman-game.specdata';
import { GameData, SerialisableGameData } from './interfaces/hangman-game';
import { deserialiseGameData, serialiseGameData } from './utilities/hangman-game';

describe('Hangman Game - guessing behaviour for single letters', () => {
  let personality: HangmanGame;
  let mockGuild: IMock<Guild>;
  let mockMessage: IMock<Message>;
  let mockLogger: IMock<Logger>;
  let mockDatabase: IMock<Database>;

  const beforeState = mockActiveGame;
  let afterState: GameData;

  beforeEach(() => {
    // Personality deps
    mockLogger = Mock.ofType<Logger>();
    mockDatabase = Mock.ofType<Database>();

    mockGuild = Mock.ofType<Guild>();
    mockGuild.setup(m => m.id).returns(() => mockGuildId);

    const mockDeps = Mock.ofType<DependencyContainer>();
    mockDeps.setup(m => m.logger).returns(() => mockLogger.object);
    mockDeps.setup(m => m.database).returns(() => mockDatabase.object);

    personality = new HangmanGame(mockDeps.object);

    // Test deps
    // Update state happens when a guess is made
    afterState = null;
    mockDatabase
      .setup(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()))
      .callback((collection: string, fields: KeyedObject) => {
        afterState = deserialiseGameData(fields as SerialisableGameData);
      })
      .returns(() => Promise.resolve());

    mockMessage = Mock.ofType<Message>();
    mockMessage.setup(s => s.guild).returns(() => mockGuild.object);

    const runningGame = serialiseGameData(beforeState);
    mockDatabase
      .setup(m => m.getRecordsFromCollection<SerialisableGameData>(It.isValue(sqlCollection), It.isAny()))
      .returns(() => Promise.resolve([runningGame]));
  });

  it('should add correct letter to display variable', done => {
    const guessLetter = 'f';
    const guessLetterUC = guessLetter.toUpperCase();

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.currentDisplay).toContain(guessLetterUC);
      done();
    });
  });

  it('should not add correct letter to wrong letters array', done => {
    const guessLetter = 'f';
    const guessLetterUC = guessLetter.toUpperCase();

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.wrongLetters).not.toContain(guessLetterUC);
      done();
    });
  });

  it('should not add incorrect letter to display variable', done => {
    const guessLetter = 'z';
    const guessLetterUC = guessLetter.toUpperCase();

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.currentDisplay).not.toContain(guessLetterUC);
      done();
    });
  });

  it('should add incorrect letter to incorrect letters array', done => {
    const guessLetter = 'z';
    const guessLetterUC = guessLetter.toUpperCase();

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.wrongLetters).toContain(guessLetterUC);
      done();
    });
  });

  it('should respond with message about the guess being wrong on incorrect guess', done => {
    const guessLetter = 'z';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(response => {
      const messageOpts = response as MessageOptions;
      expect(messageOpts.content).toContain(guessLetter.toUpperCase());
      done();
    });
  });

  it('should respond with game embed on incorrect guess', done => {
    const embedSpy = spyOn(embeds, 'generateGameEmbed').and.returnValue(new MessageEmbed());
    const guessLetter = 'z';
    const expectedDefaultColour = false;

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(response => {
      const messageOpts = response as MessageOptions;
      expect(messageOpts.embeds.length).toBe(1);
      expect(embedSpy).toHaveBeenCalledWith(jasmine.anything(), expectedDefaultColour);
      done();
    });
  });

  it('should remove life on incorrect letter', done => {
    const guessLetter = 'z';
    const beforeLives = beforeState.livesRemaining;

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(() => {
      expect(afterState.livesRemaining).toBe(beforeLives - 1);
      done();
    });
  });

  it('should not duplicate an incorrect letter', done => {
    const guessLetter = beforeState.wrongLetters[0];

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain('already been guessed');

      // Shouldn't insert or update state
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()), Times.never());
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isValue(sqlCollection), It.isAny()), Times.never());

      done();
    });
  });

  it('should not accept numeric character', done => {
    const guessChar = '4';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessChar}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain('not a letter');

      // Shouldn't insert or update state
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()), Times.never());
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isValue(sqlCollection), It.isAny()), Times.never());

      done();
    });
  });

  it('should not accept symbol character', done => {
    const guessChar = '#';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessChar}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(response).toContain('not a letter');

      // Shouldn't insert or update state
      mockDatabase.verify(m => m.updateRecordsInCollection(It.isValue(sqlCollection), It.isAny(), It.isAny()), Times.never());
      mockDatabase.verify(m => m.insertRecordsToCollection(It.isValue(sqlCollection), It.isAny()), Times.never());

      done();
    });
  });

  it('should win game with correct guess of last letter', done => {
    const winMessage = 'you win';
    const endGameSpy = spyOn(embeds, 'generateGameEndMesage').and.returnValue({ content: winMessage });
    const guessLetter = 'f';

    mockMessage.setup(s => s.content).returns(() => `${prefix} ${guessCommand} ${guessLetter}`);

    personality.onMessage(mockMessage.object).then(response => {
      expect(endGameSpy).toHaveBeenCalled();
      const responseObject = response as MessageOptions;
      expect(responseObject.content).toBe(winMessage);
      done();
    });
  });
});
