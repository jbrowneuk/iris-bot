import { Message } from 'discord.js';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';

/**
 * Game elements engine – adds features such as rolling dice, flipping coins, etc.
 */
export class DieRoll implements Personality {
  constructor(private dependencies: DependencyContainer) {}

  public onAddressed(
    message: Message,
    addressedMessage: string
  ): Promise<string> {
    const response = this.rollDice(addressedMessage);
    if (response !== null) {
      return response;
    }

    return Promise.resolve(null);
  }

  public onMessage(message: Message): Promise<string> {
    return Promise.resolve(null);
  }

  /**
   * Used as a wrapper to parse a dice roll command
   *
   * @param message the message object related to this call
   */
  private rollDice(messageContent: string): Promise<string> {
    const rollCommand = 'roll';
    if (
      !messageContent.startsWith(rollCommand) ||
      messageContent.charAt(rollCommand.length) !== ' '
    ) {
      return null;
    }

    const dice = this.parseDice(messageContent.substr(rollCommand.length + 1));
    if (dice.length === 0) {
      return null;
    }

    return Promise.resolve(dice.join('\n'));
  }

  /**
   * Used as a wrapper to parse the sides of a die for the die roll command
   *
   * @param input the raw message string with the command removed
   */
  private parseDice(input: string): string[] {
    const potentialBits = input.toLowerCase().split(' ');
    const bitsParsed = potentialBits.map((bit: string) =>
      this.handleSingleDieRoll(bit)
    );

    return bitsParsed.filter((bit: string) => bit.length > 0);
  }

  /**
   * Used to parse a die roll input and perform the die roll, using the format
   * [number]d[sides]
   *
   * @param rollInfo a string containing a potential die format
   */
  private handleSingleDieRoll(rollInfo: string): string {
    if (!rollInfo.includes('d')) {
      return '';
    }

    const split = rollInfo.split('d', 2);
    let numberDice = this.parseDieBit(split[0]);
    let numberSides = this.parseDieBit(split[1]);

    if (numberDice < 0 && numberSides < 0) {
      return `Ignoring ${rollInfo}`;
    }

    if (numberDice < 1 || numberDice > 10) {
      numberDice = 1;
    }

    if (numberSides < 4 || numberSides > 100) {
      numberSides = 6;
    }

    return this.calculateDieRoll(numberDice, numberSides);
  }

  /**
   * Conveneience method to parse a number from text. Returns -1 is parse unsuccessful
   *
   * @param bit a potential number
   */
  private parseDieBit(bit: string) {
    if (!bit) {
      return -1;
    }

    const parsed = Number.parseInt(bit, 10);
    if (Number.isNaN(parsed)) {
      return -1;
    }

    return parsed;
  }

  /**
   * Performs the rolling of virtual dice
   *
   * @param amount amount of dice to roll
   * @param sides the number of sides for this dice
   */
  private calculateDieRoll(amount: number, sides: number): string {
    const rolls: number[] = [];
    for (let roll = 0; roll < amount; roll += 1) {
      rolls.push(Math.ceil(Math.random() * sides));
    }

    return `Rolling a ${sides}-sided die ${amount} times: ${rolls.join(', ')}`;
  }
}
