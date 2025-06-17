import xs, { Stream } from "xstream";
import { REPLSources } from "./drivers/repl";
import {
  FileOperation,
  FileOperationResult,
  FileSources,
} from "./drivers/files";
import { TerminationCommand, TerminationSources } from "./drivers/termination";

// Define sources and sinks for the main function
export interface Sources {
  REPL: REPLSources;
  Files: FileSources;
  Termination: TerminationSources;
}

export interface Sinks {
  REPL: Stream<string>;
  Files: Stream<FileOperation>;
  Termination: Stream<TerminationCommand>;
}

// Generate a simple unique ID (replace with UUID library if needed)
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Parse REPL input into FileOperation commands
function parseLineToFileOperation(input: string): FileOperation | null {
  const parts = input.trim().split(" ");
  if (parts[0] === "/read" && parts[1]) {
    return {
      command: "read" as const,
      readParameters: { id: generateId(), path: parts[1] },
    } as FileOperation;
  } else if (parts[0] === "/write" && parts[1] && parts[2]) {
    return {
      command: "write" as const,
      writeParameters: {
        id: generateId(),
        path: parts[1],
        content: parts.slice(2).join(" "),
      },
    } as FileOperation;
  }
  return null;
}

// Main function to process REPL input and produce output
export function main(sources: Sources): Sinks {
  const { REPL, Files } = sources;

  // Generate FileOperation commands from REPL input
  const fileCommand$ = REPL.Line.map(parseLineToFileOperation).filter(
    (cmd): cmd is FileOperation => cmd !== null
  );

  // Generate Termination commands for /quit
  const terminationCommand$ = REPL.Line.filter(
    (input) => input.trim() === "/quit"
  ).map(() => ({ command: "quit" as const }) as TerminationCommand);

  // Format FileOperation results for REPL output
  const fileOutput$ = Files.Result.map((result: FileOperationResult) => {
    if (result.success) {
      if (result.command === "read" && result.data) {
        return `Read [${result.id}]: ${result.data}`;
      } else {
        return `Write [${result.id}] successful`;
      }
    } else {
      return `Error [${result.id}] in ${result.command}: ${result.error}`;
    }
  });

  // Echo non-command inputs
  const echoOutput$ = REPL.Line.filter(
    (input) =>
      !input.startsWith("/read ") &&
      !input.startsWith("/write ") &&
      input.trim() !== "/quit"
  ).map((input) => `Echo: ${input}`);

  // Combine all REPL outputs
  const replOutput$ = xs.merge(fileOutput$, echoOutput$);

  return {
    REPL: replOutput$,
    Files: fileCommand$,
    Termination: terminationCommand$,
  };
}
