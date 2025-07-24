import fs from "fs/promises";
import path from "path";

import { IFileOpsService } from "../../types";
import { ITool } from "../i-tool";
import { ToolResponse } from "../tool-response"; // Updated import

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

  async execute(args: Record<string, unknown>): Promise<ToolResponse> {
    const { path: dirPath } = args;
    if (typeof dirPath !== "string") {
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
    try {
      const tree = await this.buildTree(dirPath, "");
      return new ToolResponse({
        name: this.name,
        success: true,
        result: { tree },
        description: tree
          ? "Directory tree generated."
          : "Empty directory tree; valid if no contents.",
      });
    } catch (err) {
      return new ToolResponse({
        name: this.name,
        success: false,
        errors: [{ message: (err as Error).message, code: "TREE_ERROR" }],
        result: null,
        description: "Error building directory tree.",
      });
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
