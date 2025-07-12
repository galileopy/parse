import { commands } from "./commands";

describe("commands", () => {
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
});
