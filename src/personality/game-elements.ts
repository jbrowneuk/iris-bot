import * as discord from 'discord.js';
import { Personality } from '../interfaces/personality';

export class GameElements implements Personality {
  public onAddressed(
    message: discord.Message,
    addressedMessage: string
  ): Promise<string> {
    return Promise.resolve(null);
  }

  public onMessage(message: discord.Message): Promise<string> {
    return new Promise((resolve, reject) => {
      let response = this.flipCoin(message);
      if (response !== null) {
        resolve(response);
        return;
      }

      response = this.rollDice(message);
      if (response !== null) {
        resolve(response);
        return;
      }

      resolve(null);
    });
  }

  private flipCoin(message: discord.Message): string {
    if (message.content.startsWith('+flip')) {
      return Math.random() > 0.5 ? 'heads' : 'tails';
    }

    return null;
  }

  private rollDice(message: discord.Message): string {
    const rollCommand = '+roll';
    if (
      !message.content.startsWith(rollCommand) ||
      message.content.charAt(rollCommand.length) !== ' '
    ) {
      return null;
    }

    const dice = this.parseDice(message.content.substr(rollCommand.length + 1));
    if (dice.length === 0) {
      return null;
    }

    return dice.join('\n');
  }

  private parseDice(input: string): string[] {
    const potentialBits = input.toLowerCase().split(' ');
    const bitsParsed = potentialBits.map((bit: string) =>
      this.handleSingleDieRoll(bit)
    );

    return bitsParsed.filter((bit: string) => bit.length > 0);
  }

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

  private calculateDieRoll(amount: number, sides: number): string {
    const rolls: number[] = [];
    for (let roll = 0; roll < amount; roll += 1) {
      rolls.push(Math.ceil(Math.random() * sides));
    }

    return `Rolling a ${sides}-sided die ${amount} times: ${rolls.join(', ')}`;
  }
}
