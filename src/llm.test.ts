import { LlmService } from "./llm";
import { IConfigService, ILoggerService, IToolRegistry } from "./types";
import { XaiProvider } from "./providers/xai/xai.provider";
import { ChatCompletionResponse, Tool } from "./providers/xai/xai.types";
import { ITool } from "./tools/protocol";

describe("LlmService", () => {
  let mockedProvider: jest.Mocked<XaiProvider>;
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let mockedToolRegistry: jest.Mocked<IToolRegistry>;
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

    mockedToolRegistry = {
      getAll: jest.fn().mockReturnValue([]),
      register: jest.fn(),
      get: jest.fn(),
    } as jest.Mocked<IToolRegistry>;

    service = new LlmService(
      mockedProvider,
      mockedConfigService,
      mockedLogger,
      mockedToolRegistry
    );
  });

  it("throws on no config", async () => {
    mockedConfigService.getConfig.mockReturnValue(null);
    await expect(
      service.sendPrompt([{ role: "user", content: "test" }])
    ).rejects.toThrow("No authentication config loaded. Use /login.");
  });

  it("throws on empty messages", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    await expect(service.sendPrompt([])).rejects.toThrow(
      "Invalid empty prompt."
    );
  });

  it("sends prompt with history and returns response", async () => {
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

    const response = await service.sendPrompt([
      { role: "user", content: "test prompt" },
    ]);
    expect(response).toEqual(mockResponse);
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          { role: "system", content: expect.any(String) },
          { role: "user", content: "test prompt" },
        ]),
        parallel_function_calling: false,
        tool_choice: "none",
        tools: undefined,
      })
    );
  });

  it("includes tools in request if registered", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    const mockITool: ITool = {
      name: "test",
      description: "test desc",
      parameters: {},
      execute: () => Promise.resolve(""),
    };
    const mockTool: Tool = {
      type: "function",
      function: {
        name: "test",
        description: "test desc",
        parameters: {},
      },
    };
    mockedToolRegistry.getAll.mockReturnValue([mockITool]);
    const mockResponse: ChatCompletionResponse = {
      choices: [{ message: { content: "response", role: "assistant" } }],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
      usage: null,
    };
    mockedProvider.createChatCompletion.mockResolvedValue(mockResponse);

    await service.sendPrompt([{ role: "user", content: "test" }]);
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ tools: [mockTool] })
    );
  });

  it("extracts result from response", () => {
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
    expect(service.extractResult(mockResponse)).toEqual({
      content: "response",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
  });

  it("throws on invalid extract", () => {
    const mockResponse: ChatCompletionResponse = {
      choices: [],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
    };
    expect(() => service.extractResult(mockResponse)).toThrow(
      "Invalid API response format."
    );
  });

  it("handles null usage in extract", () => {
    const mockResponse: ChatCompletionResponse = {
      choices: [{ message: { content: "response", role: "assistant" } }],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
      usage: null,
    };
    expect(service.extractResult(mockResponse)).toEqual({
      content: "response",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  });
  it("prepends system prompt and sets tool_choice for supported model", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
      preferredModel: "grok-4-0709",
    });
    const mockTool: ITool = {
      name: "test",
      description: "desc",
      parameters: {},
      execute: async () => "",
    };
    mockedToolRegistry.getAll.mockReturnValue([mockTool]);
    // ... mock response
    await service.sendPrompt([{ role: "user", content: "test" }]);
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          {
            role: "system",
            content: expect.stringContaining("Use the provided tools"),
          },
        ]),
        tool_choice: "auto",
        tools: [
          {
            type: "function",
            function: { name: "test", description: "desc", parameters: {} },
          },
        ],
      })
    );
  });

  it("omits tools and warns for unsupported model", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
      preferredModel: "grok-3-mini",
    });
    mockedToolRegistry.getAll.mockReturnValue([
      /* tool */
    ]);
    // ... mock response
    await service.sendPrompt([{ role: "user", content: "test" }]);
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ tools: undefined, tool_choice: "none" })
    );
  });

  it("does not add duplicate system prompt", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
      preferredModel: "grok-3-mini",
    });

    // Test with existing system message
    await service.sendPrompt([
      { role: "system", content: "Custom" },
      { role: "user", content: "test" },
    ]);
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: "system", content: "Custom" },
          { role: "user", content: "test" },
        ],
      })
    );
  });
});
