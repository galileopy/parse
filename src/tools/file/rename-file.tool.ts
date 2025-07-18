import { ITool } from "../../tools/protocol";
import { IFileOpsService } from "../../types";

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

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<string> {
    const { old_path, new_path } = args;
    if (typeof old_path !== "string" || typeof new_path !== "string") {
      return "Invalid arguments.";
    }
    // Approval handled in REPL loop (Task 3); execute directly here
    return await this.fileOps.renameFile(old_path, new_path);
  }
}
