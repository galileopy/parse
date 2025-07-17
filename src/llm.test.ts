import { LlmService } from "./llm";
import { IConfigService, ILoggerService } from "./types";

describe("LlmService", () => {
  const mockedFetch = jest.spyOn(global, "fetch") as jest.MockedFunction<
    typeof fetch
  >;
  let mockedConfigService: jest.Mocked<IConfigService>;
  let service: LlmService;
  let mockedLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockedFetch.mockReset();

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

    service = new LlmService(mockedConfigService, mockedLogger);
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
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "response" } }],
        usage: {},
      }),
    } as Response);

    expect(await service.sendPrompt("test prompt")).toEqual({
      content: "response",
      usage: {},
    });
  });

  it("throws on API error", async () => {
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "key",
    });
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    await expect(service.sendPrompt("test")).rejects.toThrow(
      "API error: 401 Unauthorized"
    );
  });
});
