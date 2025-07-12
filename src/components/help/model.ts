import xs, { Stream } from "xstream";
import { HelpActions, HelpOperation } from "./types";

export function inputToCommand(input: string): HelpOperation {
  return { command: "help", specific: input.trim().split(" ")[1] };
}

export function stringToCommand(reason: string): HelpOperation {
  return {
    command: "help" as const,
    specific: reason,
  };
}

export function model(actions: HelpActions): Stream<HelpOperation> {
  const { internal$, input$ } = actions;
  return xs.merge(input$.map(inputToCommand), internal$.map(stringToCommand));
}
