import { promises as fs } from "fs";

import { WriteParameters, FileOperationResult } from "./types";

// Named function for write operation
export async function writeFileOperation(
  params: WriteParameters
): Promise<FileOperationResult> {
  try {
    await fs.writeFile(params.path, params.content, params.options);
    return {
      command: "write",
      success: true,
      id: params.id,
    };
  } catch (err: unknown) {
    return {
      command: "write",
      success: false,
      error: (err as Error).message,
      id: params.id,
    };
  }
}
