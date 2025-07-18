import { ITool } from "../../tools/protocol";
import { IFileOpsService } from "../../types";
import fs from "fs/promises";
import path from "path";

export class TreeDirTool implements ITool {
  name = "tree_dir";
  description = "Lists the directory tree recursively.";
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
      const tree = await this.buildTree(dirPath, "");
      return `Tree for ${dirPath}:\n${tree}`;
    } catch (err) {
      return (err as Error).message;
    }
  }

  private async buildTree(
    currentPath: string,
    indent: string
  ): Promise<string> {
    const files = await this.fileOps.listDir(currentPath);
    let result = "";
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fullPath = path.join(currentPath, file);
      const isLast = i === files.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      result += `${indent}${prefix}${file}\n`;
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          const childIndent = indent + (isLast ? "    " : "│   ");
          result += await this.buildTree(fullPath, childIndent);
        }
      } catch {
        // Skip if stat fails
      }
    }
    return result;
  }
}
