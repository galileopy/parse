import { LlmService } from "./llm";
import { IConfigService, ILoggerService, IToolMapper } from "./types";
import { XaiProvider } from "./providers/xai/xai.provider";
import { ChatCompletionResponse } from "./providers/xai/xai.types";

describe("LlmService", () => {
  let mockedProvider: jest.Mocked<XaiProvider>;
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let mockedToolMapper: jest.Mocked<IToolMapper>;
  let service: LlmService;

  beforeEach(() => {
    mockedProvider = {
      createChatCompletion: jest.fn(),
    } as unknown as jest.Mocked<XaiProvider>;

    mockedConfigService = {
      getConfig: jest.fn().mockReturnValue({ provider: "xAI", apiKey: "key" }),
      getDefaultModel: jest.fn().mockReturnValue("grok-3-mini"),
    } as unknown as jest.Mocked<IConfigService>;

    mockedLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<ILoggerService>;

    mockedToolMapper = {
      getPreparedTools: jest.fn().mockReturnValue([]),
    } as jest.Mocked<IToolMapper>;

    service = new LlmService(
      mockedProvider,
      mockedConfigService,
      mockedLogger,
      mockedToolMapper,
      "SYSTEM_PROMPT"
    );
  });

  it("sends prompt using mapper for tools", async () => {
    mockedToolMapper.getPreparedTools.mockReturnValue([
      { type: "function", function: { name: "test" } },
    ]);
    mockedProvider.createChatCompletion.mockResolvedValue({
      choices: [],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
    } as ChatCompletionResponse);
    await service.sendPrompt([{ role: "user", content: "test" }]);
    expect(mockedToolMapper.getPreparedTools).toHaveBeenCalled();
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ tools: expect.any(Array) })
    );
  });

  it("handles empty tools from mapper with tool_choice none", async () => {
    mockedProvider.createChatCompletion.mockResolvedValue({
      choices: [],
      created: 0,
      id: "id",
      model: "model",
      object: "object",
    } as ChatCompletionResponse);
    await service.sendPrompt([{ role: "user", content: "test" }]);
    expect(mockedProvider.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ tool_choice: "none" })
    );
  });
});
