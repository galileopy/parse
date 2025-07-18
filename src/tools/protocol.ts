import { ITool, IToolRegistry } from "../types";

export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, ITool> = new Map();

  public register(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  public getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  public get(name: string): ITool | undefined {
    return this.tools.get(name);
  }
}
export { ITool };
