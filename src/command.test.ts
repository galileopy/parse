import { CommandService } from "./commands";
import { IConfigService, IFileOpsService } from "./types";

describe("CommandService", () => {
  let mockedConfigService: jest.Mocked<IConfigService>;
  let mockedFileOpsService: jest.Mocked<IFileOpsService>;
  let service: CommandService;

  beforeEach(() => {
    mockedConfigService = {
      getConfig: jest.fn(),
      loadConfig: jest.fn(),
      saveConfig: jest.fn(),
      getConfigDir: jest.fn(),
      getDefaultModel: jest.fn(),
    } as jest.Mocked<IConfigService>;
    mockedFileOpsService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      ensureDir: jest.fn(),
    } as jest.Mocked<IFileOpsService>;
    service = new CommandService(mockedConfigService, mockedFileOpsService);
  });

  it("handles read invalid args", async () => {
    expect(await service.executeCommand("read", [])).toBe(
      "Invalid: /read <path>"
    );
  });

  it("handles help all", async () => {
    const help = (await service.executeCommand("help", [])) as string;
    expect(help).toContain("/read:");
  });

  it("handles help specific", async () => {
    const help = (await service.executeCommand("help", [
      "read",
      "invalid",
    ])) as string;
    expect(help).toContain("/read:");
    expect(help).toContain("No help for invalid");
  });

  it("handles login invalid args", async () => {
    expect(await service.executeCommand("login", ["onlyone"])).toBe(
      "Invalid: /login <provider> <apiKey>"
    );
  });

  describe("model", () => {
    it("lists models when no args provided", async () => {
      mockedConfigService.getConfig.mockReturnValue({
        provider: "xAI",
        apiKey: "key",
        preferredModel: "grok-3-mini",
      });
      const result = (await service.executeCommand("model", [])) as string;
      expect(result).toContain("Available models:");
      expect(result).toContain("Current: grok-3-mini");
    });

    it("sets valid model", async () => {
      mockedConfigService.getConfig.mockReturnValue({
        provider: "xAI",
        apiKey: "key",
        preferredModel: "grok-3-mini",
      });
      mockedConfigService.saveConfig.mockResolvedValue();
      const newModel = "grok-3-mini-fast";
      const result = (await service.executeCommand("model", [
        newModel,
      ])) as string;
      expect(result).toBe(`Preferred model set to ${newModel}.`);
      expect(mockedConfigService.saveConfig).toHaveBeenCalledWith(
        "xAI",
        "key",
        undefined,
        newModel
      );
    });

    it("rejects invalid model", async () => {
      mockedConfigService.getConfig.mockReturnValue({
        provider: "xAI",
        apiKey: "key",
        preferredModel: "grok-3-mini",
      });
      const result = (await service.executeCommand("model", [
        "invalid-model",
      ])) as string;
      expect(result).toContain("Invalid model: invalid-model");
    });

    it("requires config for model", async () => {
      mockedConfigService.getConfig.mockReturnValue(null);
      const result = (await service.executeCommand("model", [])) as string;
      expect(result).toBe("No config. Use /login first.");
    });
  });

  it("handles unknown command", async () => {
    expect(await service.executeCommand("unknown", [])).toBe(
      "Unknown command: /unknown. Use /help."
    );
  });
});
