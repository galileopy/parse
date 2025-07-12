import { HelpActions, HelpSources } from "./types";

function inputFilter(input: string): boolean {
  return input.startsWith("/help") || input.startsWith("\\");
}

export function intent(sources: HelpSources): HelpActions {
  const { REPL, props } = sources;
  const input$ = REPL.Line.filter(inputFilter);
  const internal$ = props.internal$;

  return {
    internal$,
    input$,
  };
}
