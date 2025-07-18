import { ITool } from "../../tools/protocol";
import { IFileOpsService } from "../../types";

export class FindFileTool implements ITool {
  name = "find_file";
  description = "Finds files by name in a directory (non-recursive).";
  parameters = {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative directory path." },
      name: { type: "string", description: "File name to search for." },
    },
    required: ["path", "name"],
  };

  constructor(private fileOps: IFileOpsService) {}

  async execute(args: Record<string, unknown>): Promise<string> {
    const { path: dirPath, name } = args;
    if (typeof dirPath !== "string" || typeof name !== "string") {
      return "Invalid arguments.";
    }
    try {
      const files = await this.fileOps.listDir(dirPath);
      const matches = files.filter((f) => f.includes(name));
      return matches.length > 0
        ? `Found:\n${matches.join("\n")}`
        : "No matches found.";
    } catch (err) {
      return (err as Error).message;
    }
  }
}
