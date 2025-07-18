import {
  CommandHandler,
  ICommandService,
  IConfigService,
  IFileOpsService,
} from "./types";

export class CommandService implements ICommandService {
  private readonly AVAILABLE_MODELS = [
    "grok-3-mini",
    "grok-3-mini-fast",
    "grok-3",
    "grok-4-0709",
  ];
  private readonly helpData: Record<string, string[]> = {
    read: ["Usage: /read <path>", "Reads the file at the given path."],
    write: ["Usage: /write <path> <content>", "Writes content to the file."],
    help: ["Usage: /help [command]", "Shows help for commands."],
    quit: ["Usage: /quit", "Exits the app."],
    login: ["Usage: /login <provider> <apiKey>", "Saves auth config."],
    model: [
      "Usage: /model [name]",
      "Lists available models or sets preferred model.",
    ],
  };

  private readonly handlers: Record<string, CommandHandler>;

  constructor(
    private configService: IConfigService,
    private fileOpsService: IFileOpsService
  ) {
    this.handlers = {
      read: this.handleRead.bind(this),
      write: this.handleWrite.bind(this),
      help: this.handleHelp.bind(this),
      login: this.handleLogin.bind(this),
      quit: this.handleQuit.bind(this),
      exit: this.handleQuit.bind(this),
      model: this.handleModel.bind(this),
    };
  }

  async executeCommand(cmd: string, args: string[]): Promise<string | void> {
    const handler = this.handlers[cmd];
    if (handler) {
      return await handler(args);
    }
    return `Unknown command: /${cmd}. Use /help.`;
  }

  private async handleRead(args: string[]): Promise<string> {
    if (args.length !== 1) return "Invalid: /read <path>";
    return await this.fileOpsService.readFile(args[0]);
  }

  private async handleWrite(args: string[]): Promise<string> {
    if (args.length < 2) return "Invalid: /write <path> <content>";
    const pathArg = args[0].trim();
    const content = args.slice(1).join(" ").trim();
    return await this.fileOpsService.writeFile(pathArg, content);
  }

  private async handleHelp(args: string[]): Promise<string> {
    if (args.length === 0) {
      return Object.entries(this.helpData)
        .map(([cmd, desc]) => `/${cmd}:\n\t${desc.join("\n\t")}`)
        .join("\n\n");
    }
    const specific = args.map((arg) => arg.trim()).join("|");
    const helps = specific
      .split("|")
      .map((cmd) =>
        this.helpData[cmd]
          ? `/${cmd}:\n\t${this.helpData[cmd].join("\n\t")}`
          : `No help for ${cmd}`
      );
    return helps.join("\n\n");
  }

  private async handleLogin(args: string[]): Promise<string> {
    if (args.length !== 2) return "Invalid: /login <provider> <apiKey>";
    try {
      await this.configService.saveConfig(args[0].trim(), args[1].trim());
      return "Auth saved and validated successfully.";
    } catch (err: unknown) {
      return `Error saving auth: ${(err as Error).message}`;
    }
  }

  private async handleQuit(): Promise<void> {
    process.exit(0);
  }

  private async handleModel(args: string[]): Promise<string> {
    const config = this.configService.getConfig();
    if (!config) return "No config. Use /login first.";

    if (args.length === 0) {
      return `Available models:\n\t${this.AVAILABLE_MODELS.join("\n\t")}\nCurrent: ${config.preferredModel || this.configService.getDefaultModel()}`; // Access private if needed, but avoided
    }

    if (args.length !== 1) {
      return "Invalid: /model [name]";
    }

    const model = args[0].trim();
    if (!this.AVAILABLE_MODELS.includes(model)) {
      return `Invalid model: ${model}. Use /model to list available models.`;
    }

    try {
      await this.configService.saveConfig(
        config.provider,
        config.apiKey,
        undefined,
        model
      );
      return `Preferred model set to ${model}.`;
    } catch (err: unknown) {
      return `Error setting model: ${(err as Error).message}`;
    }
  }
}
