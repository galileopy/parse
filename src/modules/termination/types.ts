import { Driver } from "@cycle/run";
import { Stream } from "xstream";

export interface TerminationCommand {
  command: "quit" | "exit";
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TerminationSources {}

export type TerminationDriver = Driver<
  Stream<TerminationCommand>,
  TerminationSources
>;
