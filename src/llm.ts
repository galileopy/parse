import {
  PromptResult,
  IConfigService,
  ILlmService,
  ILoggerService,
} from "./types"; // Add ILoggerService import

export class LlmService implements ILlmService {
  constructor(
    private configService: IConfigService,
    private logger: ILoggerService // New: Inject logger
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
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.preferredModel || "grok-3-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("Invalid API response format.");
      }

      return {
        content: data.choices[0].message.content.trim(),
        usage: data.usage,
      };
    } catch (err: unknown) {
      const errMsg = `Prompt failed: ${(err as Error).message}`;
      this.logger.error(errMsg); // New: Log failures
      throw new Error(errMsg);
    }
  }
}
