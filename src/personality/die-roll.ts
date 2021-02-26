import { Message } from 'discord.js';

import { DependencyContainer } from '../interfaces/dependency-container';
import { Personality } from '../interfaces/personality';

const maximumRolls = 25;

export const helpText = `This plugin helps you roll virtual dice. Ask me to roll a die in the format \`<number of die>d<number of sides>\`.
You can combine die rolls of different types by separating them with a space; for example, \`{£me} roll 4d6 5d20\``;

/**
 * Dice rolling feature
 */
export class DieRoll implements Personality {
  private totalDiceRolled: number;

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

  public onMessage(): Promise<string> {
    return Promise.resolve(null);
  }

  public onHelp(): Promise<string> {
    return Promise.resolve(helpText);
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

    this.totalDiceRolled = 0;
    const dice = this.parseDice(messageContent.substr(rollCommand.length + 1));
    if (dice.length === 0) {
      return this.dependencies.responses.generateResponse('dieRollFail');
    }

    if (this.totalDiceRolled > maximumRolls) {
      dice.push(this.dependencies.responses.generateResponse('dieRollLimit'));
    }

    return this.generateDiceResponse(dice);
  }

  /**
   * Joins the dice responses into a single message
   *
   * @param dice array of dice roll result promises
   */
  private generateDiceResponse(dice: Array<Promise<string>>): Promise<string> {
    let outputStr = '';

    const newLine = () => (outputStr.length > 0 ? '\n' : '');

    return dice
      .reduce((prev, curr) => {
        return prev.then((text) => {
          if (text !== null) {
            outputStr += newLine() + text;
          }

          return curr;
        });
      }, Promise.resolve(null))
      .then((value) => {
        return outputStr + newLine() + value;
      });
  }

  /**
   * Used as a wrapper to parse the sides of a die for the die roll command
   *
   * @param input the raw message string with the command removed
   */
  private parseDice(input: string): Array<Promise<string>> {
    const potentialBits = input.toLowerCase().split(' ');
    const bitsParsed = potentialBits.map((bit: string) =>
      this.handleSingleDieRoll(bit)
    );

    return bitsParsed.filter((bit) => bit !== null);
  }

  /**
   * Used to parse a die roll input and perform the die roll, using the format
   * [number]d[sides]
   *
   * @param rollInfo a string containing a potential die format
   */
  private handleSingleDieRoll(rollInfo: string): Promise<string> {
    if (!rollInfo.includes('d') || this.totalDiceRolled > maximumRolls) {
      return null;
    }

    const split = rollInfo.split('d', 2);
    const hasNumberDice = split[0].length > 0;
    let numberDice = this.parseDieBit(split[0]);
    let numberSides = this.parseDieBit(split[1]);

    if (hasNumberDice && numberDice < 0 && numberSides < 0) {
      return this.dependencies.responses
        .generateResponse('dieRollParseFail')
        .then((response) => response.replace('{£bit}', rollInfo));
    }

    let correctionDice: Promise<string> = null;
    if (numberDice < 0 || numberDice > 10) {
      if (hasNumberDice) {
        const cachedCount = `${numberDice}`;
        correctionDice = this.dependencies.responses
          .generateResponse('dieRollCorrectionCount')
          .then((response) => response.replace(/\{£rolls}/g, cachedCount));
      }

      numberDice = 1;
    }

    let correctionSides: Promise<string> = null;
    if (numberSides < 4 || numberSides > 100) {
      const cachedSides = `d${numberSides}`;
      correctionSides = this.dependencies.responses
        .generateResponse('dieRollCorrectionSides')
        .then((response) => response.replace(/\{£die\}/g, cachedSides));
      numberSides = 6;
    }

    this.totalDiceRolled += numberDice;
    const rollResult = this.calculateDieRoll(numberDice, numberSides);
    return Promise.all([correctionDice, correctionSides, rollResult]).then(
      ([dice, sides, result]) => {
        let outputPrefixes = '';
        if (dice !== null) {
          outputPrefixes = `${dice}\n`;
        }

        if (sides !== null) {
          outputPrefixes += `${sides}\n`;
        }

        return outputPrefixes + result;
      }
    );
  }

  /**
   * Convenience method to parse a number from text. Returns -1 is parse unsuccessful
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

    const sumRolls = rolls.reduce((prev, curr) => prev + curr, 0);
    const averageValue = sumRolls / amount;

    // Produce textual summary
    const dieRollTitle = `Rolling a *${sides}-sided* die`;
    const plural = amount !== 1 ? 's' : '';
    const rollAmount = `*${amount}* time${plural}`;
    const rollSummary = `total: ${sumRolls}, average: ${averageValue}`;
    return `${dieRollTitle} ${rollAmount}: ${rolls.join(
      ', '
    )} (${rollSummary})`;
  }
}
