import { ToolCall } from "../providers/xai/xai.types";
import {
  IAgent,
  IChatHistoryService,
  ILlmService,
  ILoggerService,
  IToolRegistry,
  IUserApprovalService,
  ParseUsage,
} from "../types";
import { ToolResponse } from "../tools/tool-response";

export class Agent implements IAgent {
  private sessionUsage: ParseUsage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
  private readonly MAX_TOOL_LOOPS = 2;

  constructor(
    private llmService: ILlmService,
    private chatHistoryService: IChatHistoryService,
    private toolRegistry: IToolRegistry,
    private logger: ILoggerService,
    private userApprovalService: IUserApprovalService
  ) {}

  async processPrompt(input: string): Promise<void> {
    try {
      this.chatHistoryService.append({ role: "user", content: input });
      let loopCount = 0;
      let previousToolCalls: ToolCall[] = [];

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

          for (const toolCall of choice.message.tool_calls) {
            this.logger.debug(`start loop:  ${loopCount}`);
            this.logger.debug(`toolCall: ${JSON.stringify(toolCall, null, 2)}`);
            const toolResponseJson = await this.executeToolCall(toolCall);

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

  public async executeToolCall(toolCall: ToolCall): Promise<string> {
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

    if (tool.requiresApproval) {
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

  public async promptUserApproval(question: string): Promise<string> {
    return await this.userApprovalService.getApproval(question);
  }

  public isRepeatedToolCall(
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
