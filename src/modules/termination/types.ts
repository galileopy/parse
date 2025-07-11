import { Driver } from "@cycle/run";
import { Stream } from "xstream";

// Define the command structure

export interface TerminationCommand {
  command: "quit" | "exit";
}

// Define source and sink types

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TerminationSources {}
// Define the driver type

export type TerminationDriver = Driver<
  Stream<TerminationCommand>,
  TerminationSources
>;
