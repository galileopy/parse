import { ConfigService } from "./config";
import { IFileOpsService, ILoggerService } from "./types";
import fs from "fs/promises";
import os from "os";
import path from "path";

const mockedFetch = jest.spyOn(global, "fetch") as jest.MockedFunction<
  typeof fetch
>;

describe("ConfigService", () => {
  let mockedFileOpsService: jest.Mocked<IFileOpsService>;
  let service: ConfigService;
  let mockedLogger: jest.Mocked<ILoggerService>;
  const testConfigDir = path.join(os.tmpdir(), ".parse-test");

  beforeEach(async () => {
    mockedLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    } as jest.Mocked<ILoggerService>;

    await fs
      .rm(testConfigDir, { recursive: true, force: true })
      .catch(() => {});
    mockedFetch.mockReset();
    mockedFileOpsService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      ensureDir: jest.fn(),
    } as jest.Mocked<IFileOpsService>;
    service = new ConfigService(mockedFileOpsService, mockedLogger);
  });

  afterAll(async () => {
    await fs.rm(testConfigDir, { recursive: true, force: true });
  });

  it("loads missing config", async () => {
    mockedFileOpsService.readFile.mockResolvedValue(
      "File not found: config.json"
    );
    await expect(service.loadConfig(testConfigDir)).rejects.toThrow(
      "Config not found"
    );
    expect(service.getConfig()).toBeNull();
  });

  it("saves and loads valid config", async () => {
    mockedFetch.mockResolvedValue({ ok: true } as Response);
    mockedFileOpsService.ensureDir.mockResolvedValue();
    mockedFileOpsService.writeFile.mockResolvedValue("Write successful.");
    await service.saveConfig("xAI", "validkey", testConfigDir);

    mockedFileOpsService.readFile.mockResolvedValue(
      JSON.stringify({
        provider: "xAI",
        apiKey: "validkey",
        preferredModel: "grok-3-mini",
      })
    );
    await service.loadConfig(testConfigDir);
    expect(service.getConfig()).toMatchObject({
      provider: "xAI",
      apiKey: "validkey",
      preferredModel: expect.any(String),
    });
  });

  it("throws on invalid key during save", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);
    await expect(
      service.saveConfig("xAI", "invalidkey", testConfigDir)
    ).rejects.toThrow("Invalid API key: 401 Unauthorized");
  });

  it("throws on invalid key during load", async () => {
    mockedFileOpsService.readFile.mockResolvedValue(
      JSON.stringify({ provider: "xAI", apiKey: "invalidkey" })
    );
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);
    await expect(service.loadConfig(testConfigDir)).rejects.toThrow(
      "Invalid API key: 401 Unauthorized"
    );
  });

  it("handles invalid JSON on load", async () => {
    mockedFileOpsService.readFile.mockResolvedValue("invalid json");
    await expect(service.loadConfig(testConfigDir)).rejects.toThrow(
      "Invalid config: Unexpected token"
    );
    expect(service.getConfig()).toBeNull();
  });

  it("returns default model", () => {
    expect(service.getDefaultModel()).toBe("grok-3-mini");
  });
});
