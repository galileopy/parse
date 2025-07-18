import { ITool } from "../../tools/protocol";
import { IFileOpsService } from "../../types";

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

  async execute(args: Record<string, unknown>): Promise<string> {
    const { path: dirPath } = args;
    if (typeof dirPath !== "string") {
      return "Invalid argument: path must be string.";
    }
    try {
      const files = await this.fileOps.listDir(dirPath);
      return `Files in ${dirPath}:\n${files.join("\n")}`;
    } catch (err) {
      return (err as Error).message;
    }
  }
}
