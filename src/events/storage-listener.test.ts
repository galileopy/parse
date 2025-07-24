import { StorageListener } from "./storage-listener";
import { IStorageService, ILoggerService, ParseChatMessage } from "../types";

describe("StorageListener", () => {
  let mockedStorage: jest.Mocked<IStorageService>;
  let mockedLogger: jest.Mocked<ILoggerService>;
  let listener: StorageListener;

  beforeEach(() => {
    mockedStorage = {
      saveSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IStorageService>;
    mockedLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<ILoggerService>;
    listener = new StorageListener(mockedStorage, mockedLogger);
  });

  it("handles event by saving session with message", async () => {
    const msg: ParseChatMessage = { role: "user", content: "test" };
    await listener.handleEvent(msg);
    expect(mockedStorage.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [msg] })
    );
  });

  it("logs error and throws on save failure", async () => {
    mockedStorage.saveSession.mockRejectedValue(new Error("save fail"));
    await expect(
      listener.handleEvent({ role: "user", content: "test" })
    ).rejects.toThrow("save fail");
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Storage failed")
    );
  });
});
