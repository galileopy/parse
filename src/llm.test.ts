import { sendPrompt } from "./llm";
import { getConfig } from "./config";

jest.mock("./config");

describe("llm", () => {
  const mockedFetch = jest.spyOn(global, "fetch") as jest.MockedFunction<
    typeof fetch
  >;
  const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

  beforeEach(() => {
    mockedFetch.mockReset();
    mockedGetConfig.mockReset();
  });

  it("throws on no config", async () => {
    mockedGetConfig.mockReturnValue(null);
    await expect(sendPrompt("test")).rejects.toThrow(
      "No authentication config loaded."
    );
  });

  it("throws on empty prompt", async () => {
    mockedGetConfig.mockReturnValue({ provider: "xAI", apiKey: "key" });
    await expect(sendPrompt("")).rejects.toThrow("Invalid empty prompt.");
  });

  it("sends prompt and returns response", async () => {
    mockedGetConfig.mockReturnValue({ provider: "xAI", apiKey: "key" });
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "response" } }],
        usage: {},
      }),
    } as Response);

    expect(await sendPrompt("test prompt")).toEqual({
      content: "response",
      usage: {},
    });
  });

  it("throws on API error", async () => {
    mockedGetConfig.mockReturnValue({ provider: "xAI", apiKey: "key" });
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    await expect(sendPrompt("test")).rejects.toThrow(
      "API error: 401 Unauthorized"
    );
  });
});
