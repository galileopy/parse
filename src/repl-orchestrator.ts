import readline from "readline";
import { ToolCall } from "./providers/xai/xai.types";
import {
  IChatHistoryService,
  ICommandService,
  IConfigService,
  ILlmService,
  ILoggerService,
  IStorageService,
  IToolRegistry,
  ParseUsage,
} from "./types";
import { ToolResponse } from "./tools/tool-response"; // Added

export class ReplOrchestrator {
  private rl: readline.Interface;
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
    private toolRegistry: IToolRegistry,
    private chatHistoryService: IChatHistoryService
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

    const result = await this.commandService.executeCommand(cmd, args);
    if (result && typeof result === "string") {
      this.logger.info(result);
    }

    this.rl.prompt();
  }

  public async handlePrompt(input: string): Promise<void> {
    try {
      this.chatHistoryService.append({ role: "user", content: input });
      let loopCount = 0;
      let previousToolCalls: ToolCall[] = []; // Track previous calls for repetition detection

      while (loopCount <= this.MAX_TOOL_LOOPS) {
        const messages = this.chatHistoryService.read();
        const response = await this.llmService.sendPrompt(messages);
        const localReasoning = response.choices[0].message.reasoning_content;
        this.logger.debug(`Local Reasoning: ${localReasoning}`);

        const localContent = response.choices[0].message.content;
        if (localContent.length > 0) {
          this.logger.debug(`Local Response: ${localContent}`);
        }

        this.logger.debug(`================ RESPONSE`);
        this.logger.debug(JSON.stringify(response, null, 2));
        this.logger.debug(`================ MESSAGES`);
        this.logger.debug(JSON.stringify(messages, null, 2));

        const choice = response.choices[0];

        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          if (
            this.isRepeatedToolCall(
              previousToolCalls,
              choice.message.tool_calls
            )
          ) {
            this.logger.warn(
              "Detected repeated tool call; breaking loop to avoid infinite repetition."
            );
            break;
          }
          previousToolCalls = choice.message.tool_calls;

          // Handle tool calls sequentially
          for (const toolCall of choice.message.tool_calls) {
            this.logger.debug(`start loop:  ${loopCount}`);
            this.logger.debug(`toolCall: ${JSON.stringify(toolCall, null, 2)}`);
            const toolResponseJson = await this.executeToolCall(toolCall); // Now JSON string

            this.chatHistoryService.append({
              role: "tool",
              content: toolResponseJson,
              tool_call_id: toolCall.id,
            });
          }
          loopCount++;

          this.logger.debug(`loopCount++ -> ${loopCount}`);
          continue;
        }

        // No tool calls: Final response
        const { content, usage } = this.llmService.extractResult(response);
        this.logger.log(`Response: ${content}`);
        this.chatHistoryService.append({ role: "assistant", content, usage });

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
      const response = new ToolResponse({
        name,
        success: false,
        errors: [{ message: `Unknown tool: ${name}`, code: "TOOL_NOT_FOUND" }],
        result: null,
      });
      return JSON.stringify(response);
    }

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argsStr);
    } catch {
      const response = new ToolResponse({
        name,
        success: false,
        errors: [
          { message: `Invalid tool args for ${name}`, code: "PARSE_ERROR" },
        ],
        result: null,
      });
      return JSON.stringify(response);
    }

    if (this.DESTRUCTIVE_TOOLS.has(name)) {
      const approval = await this.promptUserApproval(
        `Approve ${name} with args ${JSON.stringify(args)}? (y/n): `
      );

      if (approval.toLowerCase() !== "y") {
        const response = new ToolResponse({
          name,
          success: false,
          errors: [{ message: `User denied ${name}`, code: "USER_DENIED" }],
          result: null,
        });
        return JSON.stringify(response);
      }
    }

    this.logger.info(`Executing tool: ${name}`);
    const toolResponse = await tool.execute(args);
    return JSON.stringify(toolResponse);
  }

  private async promptUserApproval(question: string): Promise<string> {
    return await new Promise((resolve) => {
      this.rl.question(question, (response) => {
        resolve(response);
      });
    });
  }

  private isRepeatedToolCall(
    previousToolCalls: ToolCall[],
    newToolCalls: ToolCall[]
  ): boolean {
    this.logger.debug("=========== isRepeatedToolCall");
    this.logger.debug(
      JSON.stringify({ previousToolCalls, newToolCalls }, null, 2)
    );
    return (
      previousToolCalls.length === newToolCalls.length &&
      previousToolCalls.every((previousCall, index) => {
        const currentCall = newToolCalls[index];
        return (
          previousCall.function.name === currentCall.function.name &&
          previousCall.function.arguments === currentCall.function.arguments
        );
      })
    );
  }
}
