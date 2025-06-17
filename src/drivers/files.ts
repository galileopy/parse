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
        /**
         * If all data is successfully written to the file, and `flush`
         * is `true`, `filehandle.sync()` is used to flush the data.
         * @default false
         */
        flush?: boolean | undefined;
      } & Abortable)
    | BufferEncoding
    | null;
}

// Define the command structure (discriminated union)
export type FileOperation =
  | { command: "read"; readParameters: ReadParams }
  | { command: "write"; writeParameters: WriteParameters };

// Define the result structure
export interface FileOperationResult {
  command: "read" | "write";
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

// Make the Store driver
export function makeFileOperationDriver(): FileDriver {
  return function FileOperationDriver(
    sink: Stream<FileOperation>
  ): FileSources {
    // Process commands and produce results
    const result$ = sink
      .map((cmd) => {
        if (cmd.command === "read") {
          return xs.fromPromise(readFileOperation(cmd.readParameters));
        } else {
          return xs.fromPromise(writeFileOperation(cmd.writeParameters));
        }
      })
      .flatten();

    return {
      Result: result$,
    };
  };
}
