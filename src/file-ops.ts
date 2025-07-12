import fs from "fs/promises";

interface FsError extends Error {
  code?: string;
  message: string;
}

/**
 * Reads a file's content as UTF-8 string.
 * @param filePath - Path to the file.
 * @returns Content string or error message.
 */
export async function readFile(filePath: string): Promise<string> {
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

/**
 * Writes content to a file (UTF-8).
 * @param filePath - Path to the file.
 * @param content - Content to write.
 * @returns Success or error message.
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<string> {
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

/**
 * Ensures a directory exists (recursive).
 * @param dirPath - Directory path.
 * @returns Void on success.
 * @throws Error on failure.
 */
export async function ensureDir(dirPath: string): Promise<void> {
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
