import { IFileOpsService } from "../../types";
import { ITool } from "../i-tool";
import { ToolResponse } from "../tool-response";

export class FindFileTool implements ITool {
  name = "find_file";
  description = "Finds files by name in a directory (non-recursive).";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative directory path." },
      name: { type: "string", description: "File name to search for." },
    },
    required: ["path", "name"],
  };

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { path: dirPath, name } = args;
    if (typeof dirPath !== "string" || typeof name !== "string") {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: "Invalid arguments.", code: "VALIDATION_ERROR" }],
        result: null,
        description: "Validation failed on input arguments.",
      });
    }
    try {
      const files = await this.fileOps.listDir(dirPath);
      const matches = files.filter((f) => f.includes(name));
      return new ToolResponse({
        name: this.name,
        success: true,
        result: { matches },
        description:
          matches.length > 0
            ? "Files found matching the name."
            : "No files found; this is a valid outcome if expected.",
      });
    } catch (err) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: (err as Error).message, code: "LIST_ERROR" }],
        result: null,
        description: "Error listing directory.",
      });
    }
  }
}
