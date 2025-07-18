import { ITool } from "../../tools/protocol";
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

  async execute(args: Record<string, unknown>): Promise<string> {
    const { path: filePath, content } = args;
    if (typeof filePath !== "string" || typeof content !== "string") {
      return "Invalid arguments: path and content must be strings.";
    }
    return await this.fileOps.writeFile(filePath, content);
  }
}
