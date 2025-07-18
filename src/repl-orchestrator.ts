import readline from "readline";
import {
  IConfigService,
  ILlmService,
  ICommandService,
  IStorageService,
  ILoggerService,
  ParseChatMessage,
  ParseUsage,
  IToolRegistry,
} from "./types";
import { ToolCall } from "./providers/xai/xai.types";

export class ReplOrchestrator {
  private rl: readline.Interface;
  private sessionHistory: ParseChatMessage[] = [];
  private sessionUsage: ParseUsage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
  private readonly DESTRUCTIVE_TOOLS = new Set(["rename_file", "delete_file"]);
  private readonly MAX_TOOL_LOOPS = 2;

  constructor(
    private configService: IConfigService,
    private llmService: ILlmService,
    private commandService: ICommandService,
    private storageService: IStorageService,
    private logger: ILoggerService,
    private toolRegistry: IToolRegistry // Added for tool execution
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
      this.logger.info(result);
    }

    this.rl.prompt();
  }

  public async handlePrompt(input: string): Promise<void> {
    try {
      this.sessionHistory.push({ role: "user", content: input });
      const messages = [...this.sessionHistory];
      let loopCount = 0;

      while (loopCount < this.MAX_TOOL_LOOPS) {
        const response = await this.llmService.sendPrompt(messages);
        this.logger.log(JSON.stringify(response, null, 2));
        this.logger.log(JSON.stringify(messages, null, 2));
        const choice = response.choices[0];

        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          // Handle tool calls sequentially
          for (const toolCall of choice.message.tool_calls) {
            const result = await this.executeToolCall(toolCall);
            messages.push({
              role: "assistant",
              content: choice.message.content || "",
            });
            messages.push({
              role: "tool",
              content: result,
              tool_call_id: toolCall.id,
            });
          }
          loopCount++;
          continue;
        }

        // No tool calls: Final response
        const { content, usage } = this.llmService.extractResult(response);
        this.logger.log(`Response: ${content}`);
        this.sessionHistory.push({ role: "assistant", content, usage });

        this.sessionUsage.total_tokens += usage.total_tokens;
        this.sessionUsage.prompt_tokens += usage.prompt_tokens;
        this.sessionUsage.completion_tokens += usage.completion_tokens;

        console.table({ usage, sessionUsage: this.sessionUsage });
        break;
      }

      if (loopCount >= this.MAX_TOOL_LOOPS) {
        this.logger.warn("Max tool loops reached; aborting.");
      }
    } catch (err: unknown) {
      this.logger.error((err as Error).message);
    }
  }

  private async executeToolCall(toolCall: ToolCall): Promise<string> {
    const { name, arguments: argsStr } = toolCall.function;
    const tool = this.toolRegistry.get(name);
    if (!tool) {
      this.logger.error(`Unknown tool: ${name}`);
      return `Unknown tool: ${name}`;
    }

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argsStr);
    } catch {
      return `Invalid tool args for ${name}`;
    }

    if (this.DESTRUCTIVE_TOOLS.has(name)) {
      const approval = await this.promptUserApproval(
        `Approve ${name} with args ${JSON.stringify(args)}? (y/n): `
      );

      if (approval.toLowerCase() !== "y") {
        return `User denied ${name}`;
      }
    }

    this.logger.info(`Executing tool: ${name}`);
    return await tool.execute(args);
  }

  private async promptUserApproval(question: string): Promise<string> {
    return await new Promise((resolve) => {
      this.rl.question(question, (response) => {
        console.log("response in callback");
        resolve(response);
      });
    });
  }
}
