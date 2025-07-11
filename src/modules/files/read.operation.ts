import { promises as fs } from "fs";

import { ReadParams, FileOperationResult } from "./types";

// Named function for read operation
export async function readFileOperation(
  params: ReadParams
): Promise<FileOperationResult> {
  try {
    const data = await fs.readFile(params.path, params.options);
    return {
      command: "read",
      success: true,
      data,
      id: params.id,
    };
  } catch (err: unknown) {
    return {
      command: "read",
      success: false,
      error: (err as Error).message,
      id: params.id,
    };
  }
}
