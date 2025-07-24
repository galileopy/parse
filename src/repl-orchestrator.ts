import {
  IAgent,
  ICommandService,
  IConfigService,
  ILoggerService,
  IReadlineService,
  IStorageService,
} from "./types";

export class ReplOrchestrator {
  constructor(
    private configService: IConfigService,
    private commandService: ICommandService,
    private storageService: IStorageService,
    private logger: ILoggerService,
    private agent: IAgent,
    private readlineService: IReadlineService
  ) {}

  async start(): Promise<void> {
    try {
      await this.configService.loadConfig();
      await this.storageService.initDb();
      const config = this.configService.getConfig();
      this.logger.info(
        `Authenticated with ${config ? config.provider : "unknown"}.`
      );
    } catch (err: unknown) {
      const message = (err as Error).message;
      if (message.startsWith("Invalid API key")) {
        this.logger.error(message + " Use /login to update.");
      } else if (message.startsWith("Config not found")) {
        this.logger.error(
          "No authentication found. Use /login <provider> <apiKey>."
        );
      } else {
        this.logger.error(`Startup error: ${message}`);
      }
    }
    this.readlineService.prompt();
    this.readlineService.on("line", this.handleLine.bind(this));
  }

  public async handleLine(line: string): Promise<void> {
    const input = line.trim();
    if (input === "") {
      this.readlineService.prompt();
      return;
    }
    if (!input.startsWith("/")) {
      await this.handlePrompt(input);
      this.readlineService.prompt();
      return;
    }
    const parts = input.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const result = await this.commandService.executeCommand(cmd, args);
    if (result && typeof result === "string") {
      this.logger.info(result);
    }

    this.readlineService.prompt();
  }

  public async handlePrompt(input: string): Promise<void> {
    await this.agent.processPrompt(input);
  }
}
