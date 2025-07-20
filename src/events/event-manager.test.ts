import { EventManager } from "./event-manager";
import { ILoggerService, ParseEventHandler } from "../types";

describe("EventManager", () => {
  let mockedLogger: jest.Mocked<ILoggerService>;
  let manager: EventManager;

  beforeEach(() => {
    mockedLogger = {
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<ILoggerService>;
    manager = new EventManager(mockedLogger);
  });

  it("subscribes and emits to listener successfully", async () => {
    const mockListener: ParseEventHandler<never> = jest
      .fn()
      .mockResolvedValue(undefined);
    manager.subscribe("test", mockListener);
    await manager.emit("test", "data");
    expect(mockListener).toHaveBeenCalledWith("data");
  });

  it("retries on listener failure and succeeds on retry", async () => {
    const mockListener: ParseEventHandler<never> = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValueOnce(undefined);
    manager.subscribe("test", mockListener);
    await manager.emit("test", "data");
    expect(mockListener).toHaveBeenCalledTimes(3);
    expect(mockedLogger.warn).toHaveBeenCalledTimes(2);
  });

  it("fails after max retries and logs error", async () => {
    const mockListener: ParseEventHandler<never> = jest
      .fn()
      .mockRejectedValue(new Error("fail"));
    manager.subscribe("test", mockListener);
    await manager.emit("test", "data", { initialWaitTime: 10 });
    expect(mockListener).toHaveBeenCalledTimes(3);
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed after retries")
    );
  });

  it("does not emit to unsubscribed listener", async () => {
    const mockListener: ParseEventHandler<never> = jest.fn();
    manager.subscribe("test", mockListener);
    manager.unsubscribe("test", mockListener);
    await manager.emit("test", "data");
    expect(mockListener).not.toHaveBeenCalled();
  });

  it("handles no listeners gracefully", async () => {
    await expect(manager.emit("test", "data")).resolves.toBeUndefined();
  });
});
