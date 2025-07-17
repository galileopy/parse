import readline from "readline";
import {
  xAIChatMessage,
  xAIUsage,
  IConfigService,
  ILlmService,
  ICommandService,
  IStorageService,
  ILoggerService, // New import
} from "./types";

export class ReplOrchestrator {
  private rl: readline.Interface;
  private sessionHistory: xAIChatMessage[] = [];
  private sessionUsage: xAIUsage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  constructor(
    private configService: IConfigService,
    private llmService: ILlmService,
    private commandService: ICommandService,
    private storageService: IStorageService,
    private logger: ILoggerService // New: Inject logger
  ) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "Parse > ",
    });
  }

  async start(): Promise<void> {
    try {
      await this.configService.loadConfig();
      await this.storageService.initDb();
      const config = this.configService.getConfig();
      this.logger.info(
        `Authenticated with ${config ? config.provider : "unknown"}.`
      ); // Updated
    } catch (err: unknown) {
      const message = (err as Error).message;
      if (message.startsWith("Invalid API key")) {
        this.logger.error(message + " Use /login to update."); // Updated
      } else if (message.startsWith("Config not found")) {
        this.logger.error(
          "No authentication found. Use /login <provider> <apiKey>."
        ); // Updated
      } else {
        this.logger.error(`Startup error: ${message}`); // Updated
      }
    }
    this.rl.prompt();
    this.rl.on("line", this.handleLine.bind(this));
  }

  public async handleLine(line: string): Promise<void> {
    const input = line.trim();
    if (input === "") {
      this.rl.prompt();
      return;
    }
    if (!input.startsWith("/")) {
      await this.handlePrompt(input);
      this.rl.prompt();
      return;
    }
    const parts = input.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "quit" || cmd === "exit") {
      await this.storageService.saveSession({
        sessionId: Date.now().toString(),
        messages: this.sessionHistory,
      });
    }

    const result = await this.commandService.executeCommand(cmd, args);
    if (result && typeof result === "string") {
      this.logger.info(result); // Updated: Use logger for command results
    }

    this.rl.prompt();
  }

  public async handlePrompt(input: string): Promise<void> {
    try {
      const {
        content,
        usage: { total_tokens, prompt_tokens, completion_tokens },
      } = await this.llmService.sendPrompt(input);
      const usage = { total_tokens, prompt_tokens, completion_tokens };
      this.logger.log(`Response: ${content}`); // Updated

      this.sessionHistory.push(
        { role: "user", content: input },
        { role: "assistant", content, usage }
      );

      this.sessionUsage.total_tokens += usage.total_tokens;
      this.sessionUsage.prompt_tokens += usage.prompt_tokens;
      this.sessionUsage.completion_tokens += usage.completion_tokens;

      console.table({ usage, sessionUsage: this.sessionUsage }); // Keep table as-is (not pure log)
    } catch (err: unknown) {
      this.logger.error((err as Error).message); // Updated
    }
  }
}
