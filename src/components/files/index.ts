import { FileOperation, FileOperationResult } from "../../modules/filesystem";
import { InvalidCommandInput } from "../../errors/invalid-command-input.error";
import { FilesSources, FilesOutput } from "./types";

// Parse REPL input into FileOperation commands
export function inputToCommand(
  input: string
): FileOperation | InvalidCommandInput {
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

  return new InvalidCommandInput(
    `Invalid FileOperation command input, expected /read [filename] or /write [filename] [content] got "${input}"`
  );
}

export const inputFilter = (input: string) => {
  return input.startsWith("/read") || input.startsWith("/write");
};

// Generate a simple unique ID (replace with UUID library if needed)
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const resultToOutput = (result: FileOperationResult) => {
  if (result.success) {
    if (result.command === "read" && result.data) {
      return `Read [${result.id}]: ${result.data}`;
    } else {
      return `Write [${result.id}] successful`;
    }
  } else {
    return `Error [${result.id}] in ${result.command}: ${result.error}`;
  }
};

export function Files(sources: FilesSources): FilesOutput {
  const { REPL, Files } = sources;
  const tempCommand$ = REPL.Line.filter(inputFilter).map(inputToCommand);
  return {
    command$: tempCommand$.filter(
      (command): command is FileOperation =>
        !(command instanceof InvalidCommandInput)
    ),
    error$: tempCommand$.filter(
      (command) => command instanceof InvalidCommandInput
    ),
    output$: Files.Result.map(resultToOutput),
  };
}
