import { REPLSources } from "../../modules/repl";
import { TerminationCommand } from "../../modules/termination";
import { Stream } from "xstream";

export const inputFilter = (input: string): boolean =>
  ["/quit", "/exit"].includes(input.trim());

export const inputToCommand = () =>
  ({ command: "quit" as const }) as TerminationCommand;

export interface QuitSources {
  REPL: REPLSources;
}

export interface QuitSinks {
  command$: Stream<TerminationCommand>;
}

export function Quit(sources: QuitSources): QuitSinks {
  const { REPL } = sources;
  return {
    command$: REPL.Line.filter(inputFilter).map(inputToCommand),
  };
}
