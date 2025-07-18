import { ReplOrchestrator } from "./repl-orchestrator";
import {
  IConfigService,
  ILlmService,
  ICommandService,
  IStorageService,
  ILoggerService,
  IToolRegistry,
} from "./types";
import { Abortable } from "node:events";
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
  let mockedRl: jest.Mocked<readline.Interface>;
  let orchestrator: ReplOrchestrator;

  beforeEach(() => {
    mockedConfigService = {
      loadConfig: jest.fn(),
      getConfig: jest.fn().mockReturnValue({ provider: "xAI", apiKey: "key" }),
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
      mockedToolRegistry
    );
  });

  it("handles non-tool prompt", async () => {
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [{ message: { content: "response", role: "assistant" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    } as ChatCompletionResponse);
    mockedLlmService.extractResult.mockReturnValue({
      content: "response",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    await orchestrator.handlePrompt("test");
    expect(mockedLlmService.sendPrompt).toHaveBeenCalledWith([
      { role: "user", content: "test" },
    ]);
    expect(mockedLogger.log).toHaveBeenCalledWith("Response: response");
  });

  it("handles tool call with execution", async () => {
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
    expect(mockedLlmService.sendPrompt).toHaveBeenCalledTimes(2);
    expect(mockTool.execute).toHaveBeenCalledWith({});
    expect(mockedLogger.log).toHaveBeenCalledWith("Response: final response");
  });

  it("prompts approval for destructive tool and executes on yes", async () => {
    const mockTool: ITool = {
      name: "delete_file",
      description: "",
      parameters: {},
      execute: jest.fn().mockResolvedValue("deleted"),
    };
    mockedToolRegistry.get.mockReturnValue(mockTool);
    // Patch the type to match the overloaded signature without options
    mockedRl.question.mockImplementationOnce(
      // @ts-expect-error: Ignore overload mismatch for test
      (q: string, cb: (answer: string) => void) => cb("y")
    );
    const functionArguments = '{"path":"file.txt"}';

    mockedLlmService.sendPrompt.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "",
            role: "assistant",
            tool_calls: [
              {
                id: "call1",
                type: "function",
                function: {
                  name: "delete_file",
                  arguments: functionArguments,
                },
              },
            ],
          },
        },
      ],
      usage: null,
    } as ChatCompletionResponse);

    await orchestrator.handlePrompt("delete test");
    expect(mockedRl.question).toHaveBeenCalledWith(
      `Approve delete_file with args ${functionArguments}? (y/n): `,
      expect.any(Function)
    );
    expect(mockTool.execute).toHaveBeenCalled();
  });

  it("denies destructive tool on no", async () => {
    const mockTool: ITool = {
      name: "delete_file",
      description: "",
      parameters: {},
      execute: jest.fn(),
    };
    mockedToolRegistry.get.mockReturnValue(mockTool);
    mockedRl.question.mockImplementationOnce(
      (q: string, options: Abortable, cb: (answer: string) => void) => cb("n")
    );

    mockedLlmService.sendPrompt.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "",
            role: "assistant",
            tool_calls: [
              {
                id: "call1",
                type: "function",
                function: {
                  name: "delete_file",
                  arguments: '{"path":"file.txt"}',
                },
              },
            ],
          },
        },
      ],
      usage: null,
    } as ChatCompletionResponse);

    await orchestrator.handlePrompt("delete test");
    expect(mockTool.execute).not.toHaveBeenCalled();
  });

  it("handles unknown tool", async () => {
    mockedToolRegistry.get.mockReturnValue(undefined);

    mockedLlmService.sendPrompt.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "",
            role: "assistant",
            tool_calls: [
              {
                id: "call1",
                type: "function",
                function: { name: "unknown", arguments: "{}" },
              },
            ],
          },
        },
      ],
      usage: null,
    } as ChatCompletionResponse);

    await orchestrator.handlePrompt("test unknown");
    expect(mockedLogger.error).toHaveBeenCalledWith("Unknown tool: unknown"); // Log attempt
  });

  it("aborts on max loops", async () => {
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [
        {
          message: {
            content: "",
            role: "assistant",
            tool_calls: [
              {
                id: "call1",
                type: "function",
                function: { name: "loop_tool", arguments: "{}" },
              },
            ],
          },
        },
      ],
      usage: null,
    } as ChatCompletionResponse);

    const mockTool: ITool = {
      name: "loop_tool",
      description: "",
      parameters: {},
      execute: jest.fn().mockResolvedValue("loop"),
    };
    mockedToolRegistry.get.mockReturnValue(mockTool);

    await orchestrator.handlePrompt("loop test");
    expect(mockedLlmService.sendPrompt).toHaveBeenCalledTimes(2);
    expect(mockedLogger.warn).toHaveBeenCalledWith(
      "Max tool loops reached; aborting."
    );
  });
});
