import {
  PromptResult,
  IConfigService,
  ILlmService,
  ILoggerService,
  IToolMapper,
  ParseChatMessage,
} from "./types";
import { XaiProvider } from "./providers/xai/xai.provider";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
} from "./providers/xai/xai.types";

export class LlmService implements ILlmService {
  constructor(
    private provider: XaiProvider,
    private configService: IConfigService,
    private logger: ILoggerService,
    private toolMapper: IToolMapper,
    private readonly systemPrompt: string
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
        ? [
            { role: "system", content: this.systemPrompt } as ParseChatMessage,
            ...messages,
          ]
        : messages;

    try {
      const selectedModel = model || config.preferredModel || "grok-3-mini";

      const tools = this.toolMapper.getPreparedTools();
      const toolChoice = tools.length > 0 ? "auto" : "none";

      const request: ChatCompletionRequest = {
        model: selectedModel,
        messages: requestMessages.map<ChatMessage>((message) => ({
          role: message.role,
          content: message.content,
          ...(message.tool_call_id
            ? { tool_call_id: message.tool_call_id }
            : {}),
        })),
        tool_choice: toolChoice,
        parallel_function_calling: false,
      };
      this.logger.debug("======== REQUEST");
      this.logger.debug(JSON.stringify(request, null, 2));

      return await this.provider.createChatCompletion({ ...request, tools });
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
