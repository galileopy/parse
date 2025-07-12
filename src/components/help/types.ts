import { Stream } from "xstream";
import { REPLSources } from "../../modules/repl";

export interface HelpActions {
  internal$: Stream<string>;
  input$: Stream<string>;
}

export interface HelpOperation  {
  command: "help";
  specific?: string;
};

export interface HelpSources {
  REPL: REPLSources;
  props: { internal$: Stream<string> };
}

export interface HelpSinks {
  output$: Stream<string>;
}
