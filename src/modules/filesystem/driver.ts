import xs, { Stream } from "xstream";
import { FileDriver, FileOperation, FileSources } from "./types";
import { readFileOperation } from "./read.operation";
import { writeFileOperation } from "./write.operation";

// Make the Store driver
export function makeDriver(): FileDriver {
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
