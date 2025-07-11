import xs, { Stream } from "xstream";
import { REPLSources } from "./modules/repl/types";
import {
  FileOperation,
  FileOperationModule,
  FileSources,
} from "./modules/files";

import {
  TerminationCommand,
  TerminationModule,
  TerminationSources,
} from "./modules/termination";
import { HelpModule } from "./modules/help";
import { InvalidCommandInput } from "./modules/files/error";

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

// Main function to process REPL input and produce output
export function main(sources: Sources): Sinks {
  const { REPL, Files } = sources;

  // Commands
  const fileCommandCandidate$ = REPL.Line.filter(
    FileOperationModule.inputFilter
  ).map(FileOperationModule.inputToCommand);

  const fileCommand$ = fileCommandCandidate$.filter(
    (command): command is FileOperation =>
      !(command instanceof InvalidCommandInput)
  );

  const fileCommandInputError$ = fileCommandCandidate$
    .filter((command) => command instanceof InvalidCommandInput)
    .map(() => ({ command: "help" as const, specific: "read|write" }));

  const terminationCommand$ = REPL.Line.filter(
    TerminationModule.inputFilter
  ).map(TerminationModule.inputToCommand);

  // Outputs
  const fileOutput$ = Files.Result.map(FileOperationModule.resultToOutput);

  const helpCommand$ = REPL.Line.filter(HelpModule.inputFilter).map(
    HelpModule.inputToCommand
  );

  const helpOutput$ = xs
    .merge(helpCommand$, fileCommandInputError$)
    .map(HelpModule.commandToOutput);

  // Echo non-command inputs
  const echoOutput$ = REPL.Line.filter(
    (input) =>
      !FileOperationModule.inputFilter(input) &&
      !TerminationModule.inputFilter(input) &&
      !HelpModule.inputFilter(input)
  ).map((input) => `Echo: ${input}`);

  // Combine all REPL outputs
  const replOutput$ = xs.merge(fileOutput$, echoOutput$, helpOutput$);

  return {
    REPL: replOutput$,
    Files: fileCommand$,
    Termination: terminationCommand$,
  };
}
