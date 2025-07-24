import { ToolResponse } from "./tool-response";

describe("ToolResponse Constructor", () => {
  it("defaults version to 1.0", () => {
    const response = new ToolResponse({
      name: "test",
      success: true,
      result: {},
    });
    expect(response.version).toBe("1.0");
  });

  it("throws on non-serializable result", () => {
    expect(
      () => new ToolResponse({ name: "test", success: true, result: () => {} })
    ).toThrow("Result must be JSON serializable.");
  });
});
