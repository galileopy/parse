import {
  PromptResult,
  IConfigService,
  ILlmService,
  ILoggerService,
} from "./types";
import { XaiProvider } from "./providers/xai/xai.provider";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./providers/xai/xai.types";

export class LlmService implements ILlmService {
  constructor(
    private provider: XaiProvider,
    private configService: IConfigService,
    private logger: ILoggerService
  ) {}

  async sendPrompt(prompt: string): Promise<PromptResult> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error("No authentication config loaded. Use /login.");
    }
    if (prompt.trim() === "") {
      throw new Error("Invalid empty prompt.");
    }

    try {
      const request: ChatCompletionRequest = {
        model: config.preferredModel || "grok-3-mini",
        messages: [{ role: "user", content: prompt }],
      };

      const data: ChatCompletionResponse =
        await this.provider.createChatCompletion(request);

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("Invalid API response format.");
      }

      return {
        content: data.choices[0].message.content.trim(),
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (err: unknown) {
      const errMsg = `Prompt failed: ${(err as Error).message}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }
}
