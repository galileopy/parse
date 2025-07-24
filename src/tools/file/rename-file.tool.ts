import { ITool } from "../i-tool";
import { IFileOpsService } from "../../types";
import { ToolResponse } from "../../tools/tool-response";

export class RenameFileTool implements ITool {
  name = "rename_file";
  description =
    "Renames a file or directory. Note: Requires user approval in REPL.";
  parameters = {
    type: "object",
    properties: {
      old_path: { type: "string", description: "Old relative path." },
      new_path: { type: "string", description: "New relative path." },
    },
    required: ["old_path", "new_path"],
  };
  requiresApproval = true;

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { old_path, new_path } = args;
    if (typeof old_path !== "string" || typeof new_path !== "string") {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: "Invalid arguments.", code: "VALIDATION_ERROR" }],
        result: null,
        description: "Validation failed on input arguments.",
      });
    }
    const result = await this.fileOps.renameFile(old_path, new_path);
    if (result.startsWith("Error renaming")) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: result, code: "RENAME_ERROR" }],
        result: null,
        description: "Failed to rename due to error (e.g., file not found).",
      });
    }
    return new ToolResponse({
      name: this.name,
      success: true,
      result: { old_path, new_path, message: result },
      description: "Rename successful.",
    });
  }
}
