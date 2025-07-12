import { REPLSources } from "../../modules/repl";
import { ApplicationOutput } from "../../types";

export interface EchoSources {
  REPL: REPLSources;
}

export function Echo(source: EchoSources): ApplicationOutput {
  const { REPL } = source;
  const echoFilter = (line: string) =>
    !line.startsWith("\\") && !line.startsWith("/");
  return {
    output$: REPL.Line.filter(echoFilter).map((input) => `Echo: ${input}`),
  };
}
