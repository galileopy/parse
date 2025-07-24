import { ReplOrchestrator } from "./repl-orchestrator";
import {
  IAgent,
  ICommandService,
  IConfigService,
  ILoggerService,
  IReadlineService,
  IStorageService,
} from "./types";

describe("ReplOrchestrator", () => {
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedCommandService: jest.Mocked<ICommandService>;
  let mockedStorageService: jest.Mocked<IStorageService>;
  let mockedLogger: jest.Mocked<ILoggerService>;

  let mockedAgent: jest.Mocked<IAgent>;
  let mockedReadlineService: jest.Mocked<IReadlineService>;
  let orchestrator: ReplOrchestrator;

  beforeEach(() => {
    mockedConfigService = {
      loadConfig: jest.fn(),
      getConfig: jest.fn(),
    } as unknown as jest.Mocked<IConfigService>;
    mockedCommandService = {
      executeCommand: jest.fn(),
    } as jest.Mocked<ICommandService>;
    mockedStorageService = {
      initDb: jest.fn(),
    } as unknown as jest.Mocked<IStorageService>;
    mockedLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<ILoggerService>;
    mockedAgent = { processPrompt: jest.fn() } as jest.Mocked<IAgent>;
    mockedReadlineService = {
      prompt: jest.fn(),
      on: jest.fn(),
      question: jest.fn(),
      getInterface: jest.fn(),
    } as jest.Mocked<IReadlineService>;

    orchestrator = new ReplOrchestrator(
      mockedConfigService,

      mockedCommandService,
      mockedStorageService,
      mockedLogger,

      mockedAgent,
      mockedReadlineService
    );
  });

  it("starts and loads config/storage", async () => {
    mockedConfigService.loadConfig.mockResolvedValue(undefined);
    mockedStorageService.initDb.mockResolvedValue(undefined);
    mockedConfigService.getConfig.mockReturnValue({
      provider: "xAI",
      apiKey: "whatever",
    });

    await orchestrator.start();

    expect(mockedConfigService.loadConfig).toHaveBeenCalled();
    expect(mockedStorageService.initDb).toHaveBeenCalled();
    expect(mockedLogger.info).toHaveBeenCalledWith("Authenticated with xAI.");
    expect(mockedReadlineService.prompt).toHaveBeenCalled();
    expect(mockedReadlineService.on).toHaveBeenCalledWith(
      "line",
      expect.any(Function)
    );
  });

  it("handles non-command input by delegating to agent", async () => {
    mockedAgent.processPrompt.mockResolvedValue(undefined);

    await orchestrator.handleLine("test prompt");

    expect(mockedAgent.processPrompt).toHaveBeenCalledWith("test prompt");
    expect(mockedReadlineService.prompt).toHaveBeenCalled();
  });

  it("handles command input", async () => {
    mockedCommandService.executeCommand.mockResolvedValue("result");

    await orchestrator.handleLine("/test arg");

    expect(mockedCommandService.executeCommand).toHaveBeenCalledWith("test", [
      "arg",
    ]);
    expect(mockedLogger.info).toHaveBeenCalledWith("result");
    expect(mockedReadlineService.prompt).toHaveBeenCalled();
  });

  // Additional tests for empty input, startup errors, etc.
});
