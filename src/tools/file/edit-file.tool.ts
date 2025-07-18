import { ITool } from "../../tools/protocol";
import { IFileOpsService } from "../../types";

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

  async execute(args: Record<string, unknown>): Promise<string> {
    const { path: filePath, content, mode } = args;
    if (
      typeof filePath !== "string" ||
      typeof content !== "string" ||
      typeof mode !== "string"
    ) {
      return "Invalid arguments.";
    }
    const existing = await this.fileOps.readFile(filePath);
    if (
      existing.startsWith("File not found") ||
      existing.startsWith("Error reading")
    ) {
      return existing;
    }
    const newContent = mode === "append" ? existing + content : content;
    return await this.fileOps.writeFile(filePath, newContent);
  }
}
