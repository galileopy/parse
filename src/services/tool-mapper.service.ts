import { IToolMapper, IToolRegistry } from "../types";
import { Tool } from "../providers/xai/xai.types";
import { ITool } from "../tools/i-tool";

export class ToolMapperService implements IToolMapper {
  constructor(private toolRegistry: IToolRegistry) {}

  getPreparedTools(): Tool[] {
    const iTools: ITool[] = this.toolRegistry.getAll();
    return iTools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}
