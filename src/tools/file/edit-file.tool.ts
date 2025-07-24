import { IFileOpsService } from "../../types";
import { ITool } from "../i-tool";
import { ToolResponse } from "../tool-response"; // Updated import

export class EditFileTool implements ITool {
  name = "edit_file";
  description = "Edits an existing file by appending or replacing content.";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file." },
      content: { type: "string", description: "Content to add or replace." },
      mode: {
        type: "string",
        enum: ["append", "replace"],
        description: "Edit mode.",
      },
    },
    required: ["path", "content", "mode"],
  };

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { path: filePath, content, mode } = args;
    if (
      typeof filePath !== "string" ||
      typeof content !== "string" ||
      typeof mode !== "string"
    ) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: "Invalid arguments.", code: "VALIDATION_ERROR" }],
        result: null,
        description: "Validation failed on input arguments.",
      });
    }
    const existing = await this.fileOps.readFile(filePath);
    if (
      existing.startsWith("File not found") ||
      existing.startsWith("Error reading")
    ) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: existing, code: "FILE_NOT_FOUND" }],
        result: null,
        description: "File does not exist or read error.",
      });
    }
    const newContent = mode === "append" ? existing + content : content;
    const writeResult = await this.fileOps.writeFile(filePath, newContent);
    if (writeResult.startsWith("Error writing")) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: writeResult, code: "WRITE_ERROR" }],
        result: null,
        description: "Failed to write edited content.",
      });
    }
    return new ToolResponse({
      name: this.name,
      success: true,
      result: { path: filePath, mode, message: writeResult },
      description: "File edited successfully.",
    });
  }
}
