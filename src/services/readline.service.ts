import readline from "readline";
import { IReadlineService } from "../types";

export class ReadlineService implements IReadlineService {
  private static instance: ReadlineService | null = null;
  private rl: readline.Interface;

  private constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "Parse > ",
    });
  }

  static getInstance(): ReadlineService {
    if (!ReadlineService.instance) {
      ReadlineService.instance = new ReadlineService();
    }
    return ReadlineService.instance;
  }

  getInterface(): readline.Interface {
    return this.rl;
  }

  prompt(): void {
    this.rl.prompt();
  }

  on(event: string, listener: (line: string) => void): void {
    this.rl.on(event, listener);
  }

  async question(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}
