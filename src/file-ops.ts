import fs from "fs/promises";
import { IFileOpsService } from "./types";
import path from "path";

interface FsError extends Error {
  code?: string;
  message: string;
}

export class FileOpsService implements IFileOpsService {
  private resolveSafePath(inputPath: string): string {
    return path.resolve(process.cwd(), inputPath.trim());
  }
  async readFile(filePath: string): Promise<string> {
    if (filePath === "") {
      return "Invalid empty path.";
    }
    const safePath = this.resolveSafePath(filePath);
    try {
      return await fs.readFile(safePath, "utf8");
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err) {
        const fsErr = err as FsError;
        if (fsErr.code === "ENOENT") return `File not found: ${safePath}`;
        return `Error reading ${safePath}: ${fsErr.message}`;
      }
      return `Unknown error reading ${safePath}`;
    }
  }

  async writeFile(filePath: string, content: string): Promise<string> {
    if (filePath === "") {
      return "Invalid empty path.";
    }
    const safePath = this.resolveSafePath(filePath);
    if (content.trim() === "") return "Invalid empty content.";
    try {
      await fs.writeFile(safePath, content, "utf8");
      return `Write successful to ${safePath}.`;
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err) {
        const fsErr = err as FsError;
        return `Error writing to ${safePath}: ${fsErr.message}`;
      }
      return `Unknown error writing to ${safePath}`;
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    const safePath = this.resolveSafePath(dirPath);
    if (dirPath === "") {
      throw new Error("Invalid empty directory path.");
    }
    try {
      await fs.mkdir(safePath, { recursive: true });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "message" in err) {
        throw new Error(
          `Error creating directory ${safePath}: ${(err as FsError).message}`
        );
      }
      throw new Error(`Unknown error creating directory ${safePath}`);
    }
  }

  async listDir(dirPath: string): Promise<string[]> {
    const safePath = this.resolveSafePath(dirPath);
    try {
      return await fs.readdir(safePath);
    } catch (err: unknown) {
      throw new Error(
        `Error listing directory ${safePath}: ${(err as FsError).message}`
      );
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<string> {
    const safeOld = this.resolveSafePath(oldPath);
    const safeNew = this.resolveSafePath(newPath);
    try {
      await fs.rename(safeOld, safeNew);
      return `Rename successful: ${safeOld} to ${safeNew}.`;
    } catch (err: unknown) {
      return `Error renaming ${safeOld} to ${safeNew}: ${(err as FsError).message}`;
    }
  }

  async deleteFile(pathToDelete: string): Promise<string> {
    const safePath = this.resolveSafePath(pathToDelete);
    try {
      await fs.rm(safePath, { recursive: true, force: true });
      return `Delete successful: ${safePath}.`;
    } catch (err: unknown) {
      return `Error deleting ${safePath}: ${(err as FsError).message}`;
    }
  }
}
