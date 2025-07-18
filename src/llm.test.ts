import { LlmService } from "./llm";
import { IConfigService, ILoggerService } from "./types";
import { XaiProvider } from "./providers/xai/xai.provider";
import { ChatCompletionResponse } from "./providers/xai/xai.types";

describe("LlmService", () => {
  let mockedProvider: jest.Mocked<XaiProvider>;
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let service: LlmService;

  beforeEach(() => {
    mockedProvider = {
      createChatCompletion: jest.fn(),
    } as unknown as jest.Mocked<XaiProvider>;

    mockedConfigService = {
      getConfig: jest.fn(),
      loadConfig: jest.fn(),
      saveConfig: jest.fn(),
      getConfigDir: jest.fn(),
      getDefaultModel: jest.fn().mockReturnValue("grok-3-mini"),
    } as unknown as jest.Mocked<IConfigService>;

    mockedLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    } as jest.Mocked<ILoggerService>;

    service = new LlmService(mockedProvider, mockedConfigService, mockedLogger);
  });

  it("throws on no config", async () => {
    mockedConfigService.getConfig.mockReturnValue(null);
    await expect(service.sendPrompt("test")).rejects.toThrow(
      "No authentication config loaded. Use /login."
    );
  });

  it("throws on empty prompt", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    await expect(service.sendPrompt("")).rejects.toThrow(
      "Invalid empty prompt."
    );
  });

  it("sends prompt and returns response", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    const mockResponse: ChatCompletionResponse = {
      choices: [{ message: { content: "response", role: "assistant" } }],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
      usage: {
        completion_tokens: 1,
        prompt_tokens: 1,
        total_tokens: 2,
        completion_tokens_details: {
          accepted_prediction_tokens: 0,
          audio_tokens: 0,
          reasoning_tokens: 0,
          rejected_prediction_tokens: 0,
        },
        num_sources_used: 0,
        prompt_tokens_details: {
          audio_tokens: 0,
          cached_tokens: 0,
          image_tokens: 0,
          text_tokens: 0,
        },
      },
    };
    mockedProvider.createChatCompletion.mockResolvedValue(mockResponse);

    expect(await service.sendPrompt("test prompt")).toEqual({
      content: "response",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
  });

  it("throws on API error", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    mockedProvider.createChatCompletion.mockRejectedValue(
      new Error("API error: 401 Unauthorized")
    );

    await expect(service.sendPrompt("test")).rejects.toThrow(
      "Prompt failed: API error: 401 Unauthorized"
    );
    expect(mockedLogger.error).toHaveBeenCalledWith(
      "Prompt failed: API error: 401 Unauthorized"
    );
  });

  it("throws on invalid response format", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    const mockResponse: ChatCompletionResponse = {
      choices: [],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
    };
    mockedProvider.createChatCompletion.mockResolvedValue(mockResponse);

    await expect(service.sendPrompt("test")).rejects.toThrow(
      "Invalid API response format."
    );
  });

  it("handles null usage", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    const mockResponse: ChatCompletionResponse = {
      choices: [{ message: { content: "response", role: "assistant" } }],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
      usage: null,
    };
    mockedProvider.createChatCompletion.mockResolvedValue(mockResponse);

    expect(await service.sendPrompt("test")).toEqual({
      content: "response",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  });
});
