import xs, { Stream } from "xstream";
import { REPLSources } from "./modules/repl/types";
import { FileOperation, FileSources } from "./modules/filesystem";

import { TerminationCommand, TerminationSources } from "./modules/termination";
import { Help } from "./components/help";
import { Quit } from "./components/quit";

import { Echo } from "./components/echo";
import { Files } from "./components/files";

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
  const { REPL } = sources;

  // file application
  const files = Files(sources);
  const help = Help({
    REPL,
    props: {
      internal$: files.error$.mapTo("read|write"),
    },
  });
  const echo = Echo({ REPL });
  const quit = Quit({ REPL });

  // Combine all REPL outputs
  const replOutput$ = xs.merge(files.output$, echo.output$, help.output$);

  return {
    REPL: replOutput$,
    Files: files.command$,
    Termination: quit.command$,
  };
}
