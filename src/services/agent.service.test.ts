import { Agent } from "./agent.service";
import {
  IChatHistoryService,
  ILlmService,
  ILoggerService,
  IToolRegistry,
  IUserApprovalService,
  ParseChatMessage,
} from "../types";
import { ToolCall } from "../providers/xai/xai.types";
import { ChatCompletionResponse } from "../providers/xai/xai.types";
import { ITool } from "../tools/i-tool";

describe("Agent", () => {
  let mockedLlmService: jest.Mocked<ILlmService>;
  let mockedChatHistoryService: jest.Mocked<IChatHistoryService>;
  let mockedToolRegistry: jest.Mocked<IToolRegistry>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let mockedUserApprovalService: jest.Mocked<IUserApprovalService>;
  let agent: Agent;

  beforeEach(() => {
    mockedLlmService = {
      sendPrompt: jest.fn(),
      extractResult: jest.fn(),
    } as jest.Mocked<ILlmService>;

    mockedChatHistoryService = {
      append: jest.fn(),
      read: jest.fn().mockReturnValue([]),
    } as jest.Mocked<IChatHistoryService>;

    mockedToolRegistry = {
      get: jest.fn(),
    } as unknown as jest.Mocked<IToolRegistry>;

    mockedLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    } as jest.Mocked<ILoggerService>;

    mockedUserApprovalService = {
      getApproval: jest.fn().mockResolvedValue("y"),
    } as jest.Mocked<IUserApprovalService>;

    agent = new Agent(
      mockedLlmService,
      mockedChatHistoryService,
      mockedToolRegistry,
      mockedLogger,
      mockedUserApprovalService
    );
  });

  it("appends user message and processes prompt without tools", async () => {
    mockedChatHistoryService.read.mockReturnValue([
      { role: "user", content: "test" } as ParseChatMessage,
    ]);
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    } as unknown as ChatCompletionResponse);
    mockedLlmService.extractResult.mockReturnValue({
      content: "response",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    await agent.processPrompt("test");

    expect(mockedChatHistoryService.append).toHaveBeenCalledWith({
      role: "user",
      content: "test",
    });
    expect(mockedLlmService.sendPrompt).toHaveBeenCalled();
    expect(mockedLogger.log).toHaveBeenCalledWith("Response: response");
  });

  it("handles tool calls with loop and repetition detection", async () => {
    const toolCall: ToolCall = {
      id: "1",
      type: "function",
      function: { name: "test_tool", arguments: "{}" },
    };
    mockedChatHistoryService.read.mockReturnValue([
      { role: "user", content: "test" } as ParseChatMessage,
    ]);

    // Mock multiple identical responses to trigger repetition detection
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [{ message: { content: "", tool_calls: [toolCall] } }],
    } as unknown as ChatCompletionResponse);

    mockedToolRegistry.get.mockReturnValue({
      execute: jest.fn().mockResolvedValue({}),
      requiresApproval: false, // Explicitly false to skip approval
    } as unknown as ITool);

    await agent.processPrompt("test");

    expect(mockedLogger.warn).toHaveBeenCalledWith(
      "Detected repeated tool call; breaking loop to avoid infinite repetition."
    );
  });

  it("uses service for destructive tool approval", async () => {
    const toolCall: ToolCall = {
      id: "1",
      type: "function",
      function: { name: "delete_file", arguments: '{"path": "file.txt"}' },
    };
    mockedChatHistoryService.read.mockReturnValue([
      { role: "user", content: "delete" } as ParseChatMessage,
    ]);
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [{ message: { content: "", tool_calls: [toolCall] } }],
    } as unknown as ChatCompletionResponse);

    mockedToolRegistry.get.mockReturnValue({
      execute: jest.fn().mockResolvedValue({ success: true }),
      requiresApproval: true, // Set to true for destructive
    } as unknown as ITool);
    mockedUserApprovalService.getApproval.mockResolvedValue("y");

    await agent.processPrompt("delete");

    expect(mockedUserApprovalService.getApproval).toHaveBeenCalledWith(
      expect.stringContaining("Approve delete_file")
    );
  });

  it("handles denied approval via service", async () => {
    const toolCall: ToolCall = {
      id: "1",
      type: "function",
      function: { name: "delete_file", arguments: '{"path": "file.txt"}' },
    };
    mockedChatHistoryService.read.mockReturnValue([
      { role: "user", content: "delete" } as ParseChatMessage,
    ]);
    mockedLlmService.sendPrompt.mockResolvedValue({
      choices: [{ message: { content: "", tool_calls: [toolCall] } }],
    } as unknown as ChatCompletionResponse);

    mockedToolRegistry.get.mockReturnValue({
      execute: jest.fn().mockResolvedValue({ success: true }),
      requiresApproval: true, // Set to true for destructive
    } as unknown as ITool);
    mockedUserApprovalService.getApproval.mockResolvedValue("n");

    await agent.processPrompt("delete");

    expect(mockedChatHistoryService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "tool",
        content: expect.stringContaining("USER_DENIED"),
      })
    );
  });
});
