import { ITool } from "../../tools/protocol";
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

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<string> {
    const { path: filePath } = args;
    if (typeof filePath !== "string") {
      return "Invalid argument: path must be string.";
    }
    // Approval handled in REPL loop (Task 3); execute directly here
    return await this.fileOps.deleteFile(filePath);
  }
}
