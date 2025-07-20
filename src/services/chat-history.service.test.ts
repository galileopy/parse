import { ChatHistoryService } from "./chat-history.service";
import { IEventManager, ILoggerService, ParseChatMessage } from "../types";

describe("ChatHistoryService", () => {
  let mockedEventManager: jest.Mocked<IEventManager>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let service: ChatHistoryService;

  beforeEach(() => {
    mockedEventManager = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IEventManager>;
    mockedLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<ILoggerService>;
    service = new ChatHistoryService(mockedEventManager, mockedLogger);
  });

  it("appends message to history and emits event", () => {
    const msg: ParseChatMessage = { role: "user", content: "test" };
    service.append(msg);
    expect(service.read()).toEqual([msg]);
    expect(mockedEventManager.emit).toHaveBeenCalledWith("new-message", msg);
  });

  it("logs emission failure without throwing", async () => {
    const msg: ParseChatMessage = { role: "user", content: "test" };
    mockedEventManager.emit.mockRejectedValue(new Error("emit fail"));
    service.append(msg);
    await new Promise(process.nextTick); // For async catch
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Event emission failed")
    );
    expect(service.read()).toContain(msg); // History still updated
  });
});
