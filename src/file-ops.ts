import fs from "fs/promises";
import { IFileOpsService } from "./types";

interface FsError extends Error {
  code?: string;
  message: string;
}

export class FileOpsService implements IFileOpsService {
  async readFile(filePath: string): Promise<string> {
    const trimmedPath = filePath.trim();
    if (trimmedPath === "") return "Invalid empty path.";
    try {
      return await fs.readFile(trimmedPath, "utf8");
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err) {
        const fsErr = err as FsError;
        if (fsErr.code === "ENOENT") return `File not found: ${trimmedPath}`;
        return `Error reading ${trimmedPath}: ${fsErr.message}`;
      }
      return `Unknown error reading ${trimmedPath}`;
    }
  }

  async writeFile(filePath: string, content: string): Promise<string> {
    const trimmedPath = filePath.trim();
    if (trimmedPath === "") return "Invalid empty path.";
    if (content.trim() === "") return "Invalid empty content.";
    try {
      await fs.writeFile(trimmedPath, content, "utf8");
      return `Write successful to ${trimmedPath}.`;
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err) {
        const fsErr = err as FsError;
        return `Error writing to ${trimmedPath}: ${fsErr.message}`;
      }
      return `Unknown error writing to ${trimmedPath}`;
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    const trimmedPath = dirPath.trim();
    if (trimmedPath === "") throw new Error("Invalid empty directory path.");
    try {
      await fs.mkdir(trimmedPath, { recursive: true });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "message" in err) {
        throw new Error(
          `Error creating directory ${trimmedPath}: ${(err as FsError).message}`
        );
      }
      throw new Error(`Unknown error creating directory ${trimmedPath}`);
    }
  }
}
