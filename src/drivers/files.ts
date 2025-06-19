import xs, { Stream } from "xstream";
import { promises as fs, Mode, ObjectEncodingOptions, OpenMode } from "fs";
import { Driver } from "@cycle/run";
import { Abortable } from "events";

// Define parameters for read and write operations
export interface ReadParams {
  id: string;
  path: string;
  options?:
    | ({
        encoding: BufferEncoding;
        flag?: OpenMode | undefined;
      } & Abortable)
    | BufferEncoding;
}

export interface WriteParameters {
  id: string;
  path: string;
  content: string;
  options?:
    | (ObjectEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
        flush?: boolean | undefined;
      } & Abortable)
    | BufferEncoding
    | null;
}

export interface MkdirParameters {
  id: string;
  path: string;
  mode?: number;
}

export interface ChmodParameters {
  id: string;
  path: string;
  mode: number;
}

// Define the command structure (discriminated union)
export type FileOperation =
  | { command: "read"; readParameters: ReadParams }
  | { command: "write"; writeParameters: WriteParameters }
  | { command: "mkdir"; mkdirParameters: MkdirParameters }
  | { command: "chmod"; chmodParameters: ChmodParameters };

// Define the result structure
export interface FileOperationResult {
  command: "read" | "write" | "mkdir" | "chmod";
  success: boolean;
  data?: string | Buffer<ArrayBufferLike>; // For read success
  error?: string; // For failures
  id: string;
}

// Define source and sink types
export interface FileSources {
  Result: Stream<FileOperationResult>;
}

// Define the driver type
export type FileDriver = Driver<Stream<FileOperation>, FileSources>;

// Named function for read operation
async function readFileOperation(
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

// Named function for write operation
async function writeFileOperation(
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

// Named function for mkdir operation
async function mkdirFileOperation(
  params: MkdirParameters
): Promise<FileOperationResult> {
  try {
    await fs.mkdir(params.path, { recursive: true, mode: params.mode });
    return {
      command: "mkdir",
      success: true,
      id: params.id,
    };
  } catch (err: unknown) {
    return {
      command: "mkdir",
      success: false,
      error: (err as Error).message,
      id: params.id,
    };
  }
}

// Named function for chmod operation
async function chmodFileOperation(
  params: ChmodParameters
): Promise<FileOperationResult> {
  try {
    await fs.chmod(params.path, params.mode);
    return {
      command: "chmod",
      success: true,
      id: params.id,
    };
  } catch (err: unknown) {
    return {
      command: "chmod",
      success: false,
      error: (err as Error).message,
      id: params.id,
    };
  }
}

// Make the File driver
export function makeFileOperationDriver(): FileDriver {
  return function FileOperationDriver(
    sink: Stream<FileOperation>
  ): FileSources {
    // Process commands and produce results
    const result$ = sink
      .map((cmd) => {
        if (cmd.command === "read") {
          return xs.fromPromise(readFileOperation(cmd.readParameters));
        } else if (cmd.command === "write") {
          return xs.fromPromise(writeFileOperation(cmd.writeParameters));
        } else if (cmd.command === "mkdir") {
          return xs.fromPromise(mkdirFileOperation(cmd.mkdirParameters));
        } else {
          return xs.fromPromise(chmodFileOperation(cmd.chmodParameters));
        }
      })
      .flatten();

    return {
      Result: result$,
    };
  };
}
