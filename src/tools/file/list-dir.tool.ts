import { ITool } from "../i-tool";
import { IFileOpsService } from "../../types";
import { ToolResponse } from "../tool-response"; // Updated import

export class ListDirTool implements ITool {
  name = "list_dir";
  description = "Lists files in a directory.";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative directory path." },
    },
    required: ["path"],
  };

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { path: dirPath } = args;
    if (typeof dirPath !== "string") {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [
          {
            message: "Invalid argument: path must be string.",
            code: "VALIDATION_ERROR",
          },
        ],
        result: null,
        description: "Validation failed on input arguments.",
      });
    }
    try {
      const files = await this.fileOps.listDir(dirPath);
      return new ToolResponse({
        name: this.name,
        success: true,
        result: { files },
        description:
          files.length > 0
            ? "Directory contents listed."
            : "Empty directory; valid if no files present.",
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
