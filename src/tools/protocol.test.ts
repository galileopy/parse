import { ToolRegistry } from "./protocol";
import { ITool } from "./i-tool";
import { ToolResponse } from "./tool-response";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  const mockTool: ITool = {
    name: "testTool",
    description: "Test tool",
    parameters: { type: "object", properties: {} },
    execute: async () =>
      new ToolResponse({
        name: "testTool",
        success: true,
        result: { value: "result" },
      }),
  };
  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it("registers unique tool", () => {
    registry.register(mockTool);
    expect(registry.getAll()).toEqual([mockTool]);
    expect(registry.get("testTool")).toEqual(mockTool);
  });

  it("throws on duplicate registration", () => {
    registry.register(mockTool);
    expect(() => registry.register(mockTool)).toThrow(
      "Tool already registered: testTool"
    );
  });

  it("returns undefined for missing tool", () => {
    expect(registry.get("missing")).toBeUndefined();
  });

  it("getAll returns empty initially", () => {
    expect(registry.getAll()).toEqual([]);
  });
});
