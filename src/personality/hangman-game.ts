import { Message } from 'discord.js';
import { readFile } from 'fs';

import { Personality } from '../interfaces/personality';
import { Hangman } from '../interfaces/personality/hangman';
import { MessageType } from '../types';
import * as utils from '../utils';
import { hangmanResponse } from './formatters/hangman-game';

const startCommands = ['+start hangman', '+open hangman', '+hangman start'];
const guessCommand = '+guess ';
const defaultGuesses = 10;
const blankDisplayCharacter = '-';

export class HangmanGame implements Personality, Hangman {
  private words: string[];
  private currentWord: string;
  private guessesLeft: number;
  private lettersToDisplay: string;
  private incorrectLetters: string[];
  private incorrectWords: string[];
  private currentGameWon: boolean;

  constructor() {
    this.currentWord = null;
    this.currentGameWon = false;
  }

  private get isGameRunning(): boolean {
    return (
      this.currentWord && this.currentWord.length > 0 && !this.currentGameWon
    );
  }

  public initialise(): void {
    readFile('words.json', 'utf-8', (err, data) => {
      if (err) {
        return console.error(err.message);
      }

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return console.error('Word list is not an array');
      }

      this.words = parsed;
    });
  }

  public onAddressed(): Promise<string> {
    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<MessageType> {
    const gameResponse = this.handleMessage(message.content.toLowerCase());
    return Promise.resolve(gameResponse);
  }

  public getLettersToDisplay(): string {
    return this.lettersToDisplay;
  }

  public getIncorrectLetters(): string[] {
    return this.incorrectLetters;
  }

  public getIncorrectWords(): string[] {
    return this.incorrectWords;
  }

  public getGuessesRemaining(): number {
    return this.guessesLeft;
  }

  protected handleMessage(messageText: string): MessageType {
    if (!this.isGameRunning) {
      return this.startGame(messageText);
    }

    return this.handleGameRunning(messageText);
  }

  protected startGame(messageText: string): MessageType {
    const startCommand = utils.getValueStartedWith(messageText, startCommands);
    if (!startCommand) {
      return null;
    }

    if (!this.words || this.words.length === 0) {
      return 'No words';
    }

    // Pick a word
    const wordIndex = utils.randomInteger(this.words.length - 1);
    this.currentWord = this.words[wordIndex];

    // Initialise game
    this.lettersToDisplay = new Array(this.currentWord.length + 1).join(
      blankDisplayCharacter
    );
    this.incorrectLetters = [];
    this.incorrectWords = [];
    this.guessesLeft = defaultGuesses;
    this.currentGameWon = false;

    return hangmanResponse(this);
  }

  protected handleGameRunning(messageText: string): MessageType {
    if (!messageText.startsWith(guessCommand)) {
      return null;
    }

    const trimmedMessage = messageText.trim().substring(guessCommand.length);
    return this.handleGuess(trimmedMessage);
  }

  private handleGuess(guess: string): MessageType {
    const isWord = guess.length > 1;
    if (isWord) {
      return this.onGuessWord(guess);
    }

    return this.onGuessLetter(guess);
  }

  private onGuessWord(guess: string): MessageType {
    const invalidWordRegex = /[^a-z]+/;
    if (invalidWordRegex.test(guess)) {
      return 'That’s not a word I can use here.';
    }

    if (guess.length !== this.currentWord.length) {
      const wordText = `${this.currentWord.length}`;
      return `Your guess has ${guess.length} letters, the word has ${wordText}. Think about that for a while.`;
    }

    if (guess === this.currentWord) {
      this.currentWord = '';
      this.currentGameWon = true;
      return `Yup, it’s “${guess}”`;
    }

    if (this.incorrectWords.indexOf(guess) !== -1) {
      return 'You’ve already guessed that one!';
    }

    this.guessesLeft -= 1;
    this.incorrectWords.push(guess);

    if (this.guessesLeft <= 0) {
      const cachedWord = this.currentWord;
      this.currentWord = '';
      return `You’ve lost! The word was “${cachedWord}”`;
    }

    return hangmanResponse(this);
  }

  private onGuessLetter(guess: string): MessageType {
    if (!guess.match(/[a-z]/)) {
      return 'That’s not a letter I can use…';
    }

    if (this.currentWord.indexOf(guess) === -1) {
      this.incorrectLetters.push(guess);
      this.guessesLeft -= 1;

      if (this.guessesLeft > 0) {
        return `Nope, there’s no “${guess}”. You’ve got ${this.guessesLeft} chances remaining!`;
      }

      const cachedWord = this.currentWord;
      this.currentWord = '';
      return `Bad luck! The word was “${cachedWord}”`;
    }

    // Copy the letter into the display variable
    for (let index = 0; index < this.lettersToDisplay.length; index += 1) {
      const currentLetter = this.lettersToDisplay[index];
      if (currentLetter !== blankDisplayCharacter) {
        continue;
      }

      if (this.currentWord[index] !== guess) {
        continue;
      }

      const lettersBefore = this.lettersToDisplay.substring(0, index);
      const lettersAfter = this.lettersToDisplay.substring(index + 1);
      this.lettersToDisplay = `${lettersBefore}${guess}${lettersAfter}`;
    }

    if (this.currentWord === this.lettersToDisplay) {
      const winWord = this.currentWord;
      this.currentWord = '';
      this.currentGameWon = true;
      return `Yup, it’s “${winWord}”`;
    }

    return hangmanResponse(this);
  }
}
