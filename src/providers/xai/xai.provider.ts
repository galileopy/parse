import { IConfigService, ILoggerService } from "../../types";
import {
  ApiKeyResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelsResponse,
} from "./xai.types";

export class XaiProvider {
  private readonly baseUrl = "https://api.x.ai/v1";

  constructor(
    private configService: IConfigService,
    private logger: ILoggerService
  ) {}

  async getApiKey(): Promise<ApiKeyResponse> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error("No authentication config loaded.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/api-key`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errMsg = `API error: ${response.status} ${response.statusText}`;
        this.logger.error(errMsg);
        throw new Error(errMsg);
      }

      return (await response.json()) as ApiKeyResponse;
    } catch (err: unknown) {
      const errMsg = `Failed to get API key: ${(err as Error).message}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  async getModels(): Promise<ModelsResponse> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error("No authentication config loaded.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errMsg = `API error: ${response.status} ${response.statusText}`;
        this.logger.error(errMsg);
        throw new Error(errMsg);
      }

      return (await response.json()) as ModelsResponse;
    } catch (err: unknown) {
      const errMsg = `Failed to get models: ${(err as Error).message}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  async createChatCompletion(
    body: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error("No authentication config loaded.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errMsg = `API error: ${response.status} ${response.statusText}`;
        this.logger.error(errMsg);
        throw new Error(errMsg);
      }

      return (await response.json()) as ChatCompletionResponse;
    } catch (err: unknown) {
      const errMsg = `Failed to create chat completion: ${(err as Error).message}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }
}