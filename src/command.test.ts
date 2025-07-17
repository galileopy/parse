import { AVAILABLE_MODELS, commands } from "./commands";
import { getConfig, saveConfig } from "./config";

jest.mock("./config");

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockedSaveConfig = saveConfig as jest.MockedFunction<typeof saveConfig>;

describe("commands", () => {
  beforeEach(() => {
    mockedGetConfig.mockReset();
    mockedSaveConfig.mockReset();
  });

  it("handles read invalid args", async () => {
    expect(await commands.read([])).toBe("Invalid: /read <path>");
  });

  it("handles help all", async () => {
    const help = await commands.help([]);
    expect(help).toContain("/read:");
  });

  it("handles help specific", async () => {
    const help = await commands.help(["read", "invalid"]);
    expect(help).toContain("/read:");
    expect(help).toContain("No help for invalid");
  });

  it("handles login invalid args", async () => {
    expect(await commands.login(["onlyone"])).toBe(
      "Invalid: /login <provider> <apiKey>"
    );
  });

  describe("model", () => {
    it("lists models when no args provided", async () => {
      mockedGetConfig.mockReturnValue({
        provider: "xAI",
        apiKey: "key",
        preferredModel: "grok-3-mini",
      });
      const result = await commands.model([]);
      expect(result).toContain(
        `Available models:\n\t${AVAILABLE_MODELS.join("\n\t")}`
      );
      expect(result).toContain("Current: grok-3-mini");
    });

    it("sets valid model", async () => {
      mockedGetConfig.mockReturnValue({
        provider: "xAI",
        apiKey: "key",
        preferredModel: "grok-3-mini",
      });
      const newModel = "grok-3-mini-fast";
      mockedSaveConfig.mockResolvedValue();
      const result = await commands.model([newModel]);
      expect(result).toBe(`Preferred model set to ${newModel}.`);
      expect(mockedSaveConfig).toHaveBeenCalledWith(
        "xAI",
        "key",
        undefined,
        newModel
      );
    });

    it("rejects invalid model", async () => {
      mockedGetConfig.mockReturnValue({
        provider: "xAI",
        apiKey: "key",
        preferredModel: "grok-3-mini",
      });
      const result = await commands.model(["invalid-model"]);
      expect(result).toContain("Invalid model: invalid-model");
    });

    it("requires config for model", async () => {
      mockedGetConfig.mockReturnValue(null);
      const result = await commands.model([]);
      expect(result).toBe("No config. Use /login first.");
    });
  });
});
