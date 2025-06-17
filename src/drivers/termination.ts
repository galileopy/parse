import { Stream } from "xstream";
import { Driver } from "@cycle/run";

// Define the command structure
export interface TerminationCommand {
  command: "quit";
}

// Define source and sink types
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TerminationSources {}

// Define the driver type
export type TerminationDriver = Driver<
  Stream<TerminationCommand>,
  TerminationSources
>;

// Make the Termination driver
export function makeTerminationDriver(): TerminationDriver {
  return function TerminationDriver(
    sink: Stream<TerminationCommand>
  ): TerminationSources {
    // Subscribe to the Command stream to exit on quit
    sink.addListener({
      next(cmd: TerminationCommand) {
        if (cmd.command === "quit") {
          process.exit(0); // Exit with success code
        }
      },
    });

    return {};
  };
}
