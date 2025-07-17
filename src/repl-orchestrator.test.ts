import { ReplOrchestrator } from "./repl-orchestrator";
import {
  IConfigService,
  ILlmService,
  ICommandService,
  IStorageService,
  PromptResult,
  ILoggerService,
} from "./types";
import readline from "readline";

jest.mock("readline"); // Mock readline for testing

describe("ReplOrchestrator", () => {
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedLlmService: jest.Mocked<ILlmService>;
  let mockedCommandService: jest.Mocked<ICommandService>;
  let mockedStorageService: jest.Mocked<IStorageService>;
  let mockedRl: jest.Mocked<readline.Interface>;
  let orchestrator: ReplOrchestrator;
  let mockedLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockedLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    } as jest.Mocked<ILoggerService>;
    mockedConfigService = {
      loadConfig: jest.fn(),
      getConfig: jest.fn(),
      getDefaultModel: jest.fn(),
    } as unknown as jest.Mocked<IConfigService>;
    mockedLlmService = { sendPrompt: jest.fn() } as jest.Mocked<ILlmService>;
    mockedCommandService = {
      executeCommand: jest.fn(),
    } as jest.Mocked<ICommandService>;
    mockedStorageService = {
      initDb: jest.fn(),
      saveSession: jest.fn(),
    } as jest.Mocked<IStorageService>;

    mockedRl = {
      prompt: jest.fn(),
      on: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<readline.Interface>;

    jest.spyOn(readline, "createInterface").mockReturnValue(mockedRl);

    orchestrator = new ReplOrchestrator(
      mockedConfigService,
      mockedLlmService,
      mockedCommandService,
      mockedStorageService,
      mockedLogger
    );
  });

  it("starts and handles config load error", async () => {
    mockedConfigService.loadConfig.mockRejectedValue(
      new Error("Config not found")
    );
    mockedStorageService.initDb.mockResolvedValue();
    await orchestrator.start();
    expect(mockedLogger.error).toHaveBeenCalledWith(
      "No authentication found. Use /login <provider> <apiKey>."
    );
  });

  it("handles prompt input", async () => {
    const input = "test prompt";
    mockedLlmService.sendPrompt.mockResolvedValue({
      content: "response",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    } as PromptResult);
    await orchestrator.handlePrompt(input); // Private method test
    expect(mockedLlmService.sendPrompt).toHaveBeenCalledWith(input);
    expect(mockedLogger.log).toHaveBeenCalledWith("Response: response");
  });

  it("handles command input with quit", async () => {
    mockedCommandService.executeCommand.mockResolvedValue("result");
    mockedStorageService.saveSession.mockResolvedValue();
    await orchestrator.handleLine("/quit"); // Simulate line event
    expect(mockedStorageService.saveSession).toHaveBeenCalled();
  });
});
