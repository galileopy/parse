import { IFileOpsService } from "../../types";
import { ITool } from "../i-tool";
import { ToolResponse } from "../tool-response";

export class ReadFileTool implements ITool {
  name = "read_file";
  description = "Reads the content of an existing file.";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file." },
    },
    required: ["path"],
  };

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
    const content = await this.fileOps.readFile(filePath);
    if (
      content.startsWith("File not found") ||
      content.startsWith("Error reading")
    ) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: content, code: "FILE_NOT_FOUND" }],
        result: null,
        description: "File does not exist or read error.",
      });
    }
    return new ToolResponse({
      name: this.name,
      success: true,
      result: { content },
      description: "File content read successfully.",
    });
  }
}
