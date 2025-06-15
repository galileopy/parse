import { Stream } from "xstream";
import { REPLSources } from "./drivers/repl";

// Define sources and sinks for the main function
export interface Sources {
  REPL: REPLSources;
}

export interface Sinks {
  REPL: Stream<string>;
}

// Main function to process REPL input and produce output
export function main(sources: Sources): Sinks {
  const { REPL } = sources;

  // Transform Line input to Line output (echo with prefix for testing)
  const lineOut$ = REPL.Line.map((input) => `Echo: ${input}`);

  return {
    REPL: lineOut$,
  };
}
