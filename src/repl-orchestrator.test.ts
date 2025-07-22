import { ReplOrchestrator } from "./repl-orchestrator";
import {
  IConfigService,
  ILlmService,
  ICommandService,
  IStorageService,
  ILoggerService,
  IToolRegistry,
  IChatHistoryService,
} from "./types";
import readline from "readline"; // Updated: Import Abortable
import { ChatCompletionResponse } from "./providers/xai/xai.types";
import { ITool } from "./tools/protocol";

jest.mock("readline"); // Mock readline for testing

describe("ReplOrchestrator", () => {
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedLlmService: jest.Mocked<ILlmService>;
  let mockedCommandService: jest.Mocked<ICommandService>;
  let mockedStorageService: jest.Mocked<IStorageService>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let mockedToolRegistry: jest.Mocked<IToolRegistry>;
  let mockedChatHistory: jest.Mocked<IChatHistoryService>;
  let mockedRl: jest.Mocked<readline.Interface>;
  let orchestrator: ReplOrchestrator;

  beforeEach(() => {
    mockedConfigService = {
      getConfig: jest.fn().mockReturnValue({ provider: "xAI", apiKey: "key" }),
      loadConfig: jest.fn(),
      getDefaultModel: jest.fn(),
    } as unknown as jest.Mocked<IConfigService>;

    mockedLlmService = {
      sendPrompt: jest.fn(),
      extractResult: jest.fn(),
    } as jest.Mocked<ILlmService>;

    mockedCommandService = {
      executeCommand: jest.fn(),
    } as jest.Mocked<ICommandService>;

    mockedStorageService = {
      initDb: jest.fn(),
      saveSession: jest.fn(),
    } as jest.Mocked<IStorageService>;

    mockedLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    } as jest.Mocked<ILoggerService>;

    mockedToolRegistry = {
      getAll: jest.fn(),
      register: jest.fn(),
      get: jest.fn(),
    } as jest.Mocked<IToolRegistry>;

    mockedChatHistory = {
      append: jest.fn(),
      read: jest.fn().mockReturnValue([]),
    } as jest.Mocked<IChatHistoryService>;

    mockedRl = {
      prompt: jest.fn(),
      on: jest.fn().mockReturnThis(),
      question: jest.fn((query: string, callback: (answer: string) => void) => {
        callback(""); // Default; overridden in tests
      }),
    } as unknown as jest.Mocked<readline.Interface>;

    jest.spyOn(readline, "createInterface").mockReturnValue(mockedRl);

    orchestrator = new ReplOrchestrator(
      mockedConfigService,
      mockedLlmService,
      mockedCommandService,
      mockedStorageService,
      mockedLogger,
      mockedToolRegistry,
      mockedChatHistory
    );
  });

  it("handles non-tool prompt with history append", async () => {
    mockedChatHistory.read.mockReturnValue([{ role: "user", content: "test" }]);
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [{ message: { content: "response", role: "assistant" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    } as ChatCompletionResponse);
    mockedLlmService.extractResult.mockReturnValue({
      content: "response",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    await orchestrator.handlePrompt("test");
    expect(mockedChatHistory.append).toHaveBeenCalledWith({
      role: "user",
      content: "test",
    });
    expect(mockedChatHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ role: "assistant", content: "response" })
    );
  });

  it("handles tool call with history appends", async () => {
    const mockTool: ITool = {
      name: "test_tool",
      description: "",
      parameters: {},
      execute: jest.fn().mockResolvedValue("tool result"),
    };
    mockedToolRegistry.get.mockReturnValue(mockTool);

    mockedLlmService.sendPrompt
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "",
              role: "assistant",
              tool_calls: [
                {
                  id: "call1",
                  type: "function",
                  function: { name: "test_tool", arguments: "{}" },
                },
              ],
            },
          },
        ],
        usage: null,
      } as ChatCompletionResponse)
      .mockResolvedValueOnce({
        choices: [
          { message: { content: "final response", role: "assistant" } },
        ],
        usage: { prompt_tokens: 2, completion_tokens: 2, total_tokens: 4 },
      } as ChatCompletionResponse);

    mockedLlmService.extractResult.mockReturnValue({
      content: "final response",
      usage: { prompt_tokens: 2, completion_tokens: 2, total_tokens: 4 },
    });

    await orchestrator.handlePrompt("test with tool");
    expect(mockedChatHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ role: "tool" })
    );
    expect(mockedChatHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ role: "assistant", content: "final response" })
    );
  });

  it("breaks loop on repeated tool calls", async () => {
    const mockTool: ITool = {
      name: "test_tool",
      description: "",
      parameters: {},
      execute: jest.fn().mockResolvedValue("tool result"),
    };
    mockedToolRegistry.get.mockReturnValue(mockTool);

    const repeatedToolResponse = {
      choices: [
        {
          message: {
            content: "",
            role: "assistant",
            tool_calls: [
              {
                id: "call1",
                type: "function",
                function: { name: "test_tool", arguments: "{}" },
              },
            ],
          },
        },
      ],
      usage: null,
    } as ChatCompletionResponse;

    mockedLlmService.sendPrompt
      .mockResolvedValueOnce(repeatedToolResponse)
      .mockResolvedValueOnce(repeatedToolResponse); // Simulate repetition

    await orchestrator.handlePrompt("test with repeated tool");
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      "Detected repeated tool call; breaking loop to avoid infinite repetition."
    );
    expect(mockedLlmService.sendPrompt).toHaveBeenCalledTimes(2); // Called twice, but breaks before third
  });

  it("reaches max loops and warns without repetition", async () => {
    const mockTool: ITool = {
      name: "test_tool",
      description: "",
      parameters: {},
      execute: jest.fn().mockResolvedValue("tool result"),
    };
    mockedToolRegistry.get.mockReturnValue(mockTool);

    const toolResponse = () =>
      ({
        choices: [
          {
            message: {
              content: "",
              role: "assistant",
              tool_calls: [
                {
                  id: "call" + Math.random(),
                  type: "function",
                  function: {
                    name: "test_tool",
                    arguments: `{ number : ${Math.random()}}`, // Different arguments to avoid repetition detection
                  },
                },
              ],
            },
          },
        ],
        usage: null,
      }) as ChatCompletionResponse;

    mockedLlmService.sendPrompt
      .mockResolvedValue(toolResponse())
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(toolResponse());

    await orchestrator.handlePrompt("test with max loops");
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      "Max tool loops reached; aborting."
    );
    expect(mockedLlmService.sendPrompt).toHaveBeenCalledTimes(3);
  });
});
