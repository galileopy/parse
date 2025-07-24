import { ITool } from "../i-tool";
import { ToolResponse } from "../tool-response"; // Updated import
import { IFileOpsService } from "../../types";

export class CreateFileTool implements ITool {
  name = "create_file";
  description = "Creates a new file with the given content.";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file." },
      content: { type: "string", description: "Content to write." },
    },
    required: ["path", "content"],
  };

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { path: filePath, content } = args;
    if (typeof filePath !== "string" || typeof content !== "string") {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [
          {
            message: "Invalid arguments: path and content must be strings.",
            code: "VALIDATION_ERROR",
          },
        ],
        result: null,
        description: "Validation failed on input arguments.",
      });
    }
    const result = await this.fileOps.writeFile(filePath, content);
    if (
      result.startsWith("Error writing") ||
      result.startsWith("Invalid empty")
    ) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: result, code: "WRITE_ERROR" }],
        result: null,
        description:
          "Failed to create file due to write error or invalid content.",
      });
    }
    return new ToolResponse({
      name: this.name,
      success: true,
      result: { path: filePath, message: result },
      description: "File created successfully.",
    });
  }
}
