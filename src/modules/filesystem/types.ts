import { Driver } from "@cycle/run";
import { Abortable } from "events";
import { OpenMode, ObjectEncodingOptions, Mode } from "fs";

import { Stream } from "xstream";

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
