import { loadConfig, saveConfig, getConfig } from "./config";
import fs from "fs/promises";
import os from "os";
import path from "path";

const mockedFetch = jest.spyOn(global, "fetch") as jest.MockedFunction<
  typeof fetch
>;

describe("config", () => {
  const testConfigDir = path.join(os.tmpdir(), ".parse-test");

  beforeEach(async () => {
    await fs
      .rm(testConfigDir, { recursive: true, force: true })
      .catch(() => {});
    mockedFetch.mockReset();
  });

  afterAll(async () => {
    await fs.rm(testConfigDir, { recursive: true, force: true });
  });

  it("loads missing config", async () => {
    await expect(loadConfig(testConfigDir)).rejects.toThrow("Config not found");
    expect(getConfig()).toBeNull();
  });

  it("saves and loads valid config", async () => {
    mockedFetch.mockResolvedValue({ ok: true } as Response);
    await saveConfig("xAI", "validkey", testConfigDir);
    await loadConfig(testConfigDir);
    expect(getConfig()).toMatchObject({
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
      saveConfig("xAI", "invalidkey", testConfigDir)
    ).rejects.toThrow("Invalid API key: 401 Unauthorized");
  });

  it("throws on invalid key during load", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);
    await fs.mkdir(testConfigDir, { recursive: true });
    const configPath = path.join(testConfigDir, "config.json");
    await fs.writeFile(
      configPath,
      JSON.stringify({ provider: "xAI", apiKey: "invalidkey" })
    );
    await expect(loadConfig(testConfigDir)).rejects.toThrow(
      "Invalid API key: 401 Unauthorized"
    );
  });

  it("handles invalid JSON on load", async () => {
    await fs.mkdir(testConfigDir, { recursive: true });
    const configPath = path.join(testConfigDir, "config.json");
    await fs.writeFile(configPath, "invalid json");
    await expect(loadConfig(testConfigDir)).rejects.toThrow(
      "Invalid config: Unexpected token"
    );
    expect(getConfig()).toBeNull();
  });
});
