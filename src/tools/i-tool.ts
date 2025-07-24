import { ToolResponse } from "./tool-response";

export interface ITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  requiresApproval?: boolean;
  execute(args: Record<string, unknown>): Promise<ToolResponse>; // Updated return type
}
