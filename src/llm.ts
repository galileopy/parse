import {
  PromptResult,
  IConfigService,
  ILlmService,
  ILoggerService,
  IToolRegistry,
  ParseChatMessage,
} from "./types";
import { XaiProvider } from "./providers/xai/xai.provider";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Tool,
} from "./providers/xai/xai.types";
import { ITool } from "./tools/protocol";

export class LlmService implements ILlmService {
  // Supported models for tools (based on docs)
  private readonly SYSTEM_PROMPT =
    "You are Parse, a coding assistant specializing in file operations. Use the provided tools for tasks like checking file existence (use find_file or list_dir), listing directories, editing files, etc. Prefer tool calls over text responses for file-related queries.";

  constructor(
    private provider: XaiProvider,
    private configService: IConfigService,
    private logger: ILoggerService,
    private toolRegistry: IToolRegistry
  ) {}

  async sendPrompt(
    messages: ParseChatMessage[],
    model?: string
  ): Promise<ChatCompletionResponse> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error("No authentication config loaded. Use /login.");
    }
    if (
      messages.length === 0 ||
      messages[messages.length - 1].content.trim() === ""
    ) {
      throw new Error("Invalid empty prompt.");
    }

    const requestMessages =
      messages[0]?.role !== "system"
        ? [{ role: "system", content: this.SYSTEM_PROMPT }, ...messages]
        : messages;

    try {
      const selectedModel = model || config.preferredModel || "grok-3-mini";

      const itools: ITool[] = this.toolRegistry.getAll();
      const tools: Tool[] | undefined =
        itools.length > 0
          ? itools.map((tool) => ({
              type: "function",
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            }))
          : undefined;
      const toolChoice = tools ? "auto" : "none";

      this.logger.debug(
        `Transformed tools for request: ${JSON.stringify(tools, null, 2)}`
      );

      const request: ChatCompletionRequest = {
        model: selectedModel,
        messages: requestMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools,
        tool_choice: toolChoice,
        parallel_function_calling: false,
      };

      return await this.provider.createChatCompletion(request);
    } catch (err: unknown) {
      const errMsg = `Prompt failed: ${(err as Error).message}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  // Helper to extract PromptResult from response (for non-tool cases)
  extractResult(response: ChatCompletionResponse): PromptResult {
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error("Invalid API response format.");
    }
    return {
      content: response.choices[0].message.content.trim(),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  }
}
