import { LoggerService } from "./logger";

describe("LoggerService", () => {
  let service: LoggerService;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new LoggerService();
    consoleInfoSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs log message", () => {
    service.log("test info");
    expect(consoleLogSpy).toHaveBeenCalledWith("test info");
  });
  it("logs info message", () => {
    service.info("test info");
    expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] test info");
  });

  it("logs error message", () => {
    service.error("test error");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] test error");
  });

  it("logs debug only if enabled", () => {
    process.env.DEBUG = "true";
    service.debug("test debug");
    expect(consoleDebugSpy).toHaveBeenCalledWith("[DEBUG] test debug");

    process.env.DEBUG = "false";
    service.debug("test debug");
    expect(consoleDebugSpy).toHaveBeenCalledTimes(1); // Not called again
  });

  it("logs warn message", () => {
    service.warn("test warn");
    expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] test warn");
  });
});
