import { ITool } from "../i-tool";
import { ToolResponse } from "../tool-response"; // Updated import
import { IFileOpsService } from "../../types";

export class DeleteFileTool implements ITool {
  name = "delete_file";
  description =
    "Deletes a file or directory. Note: Requires user approval in REPL.";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to delete." },
    },
    required: ["path"],
  };
  requiresApproval = true;

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { path: filePath } = args;
    if (typeof filePath !== "string") {
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
    const result = await this.fileOps.deleteFile(filePath);
    if (result.startsWith("Error deleting")) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: result, code: "DELETE_ERROR" }],
        result: null,
        description: "Failed to delete due to error.",
      });
    }
    return new ToolResponse({
      name: this.name,
      success: true,
      result: { path: filePath, message: result },
      description:
        "Deletion successful; note: no error on missing files due to force option.",
    });
  }
}
