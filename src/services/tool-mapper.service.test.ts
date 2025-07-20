import { ToolMapperService } from "./tool-mapper.service";
import { IToolRegistry } from "../types";
import { ITool } from "../tools/protocol";

describe("ToolMapperService", () => {
  let mockedRegistry: jest.Mocked<IToolRegistry>;
  let service: ToolMapperService;

  beforeEach(() => {
    mockedRegistry = {
      getAll: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<IToolRegistry>;
    service = new ToolMapperService(mockedRegistry);
  });

  it("maps registered tools to LLM format", () => {
    const mockTool: ITool = {
      name: "testTool",
      description: "desc",
      parameters: { type: "object" },
      execute: jest.fn(),
    };
    mockedRegistry.getAll.mockReturnValue([mockTool]);
    const result = service.getPreparedTools();
    expect(result).toEqual([
      {
        type: "function",
        function: {
          name: "testTool",
          description: "desc",
          parameters: { type: "object" },
        },
      },
    ]);
  });

  it("returns empty array for no registered tools", () => {
    expect(service.getPreparedTools()).toEqual([]);
  });
});
