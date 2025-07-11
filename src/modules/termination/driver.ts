import { Stream } from "xstream";
import {
  TerminationDriver,
  TerminationCommand,
  TerminationSources,
} from "./types";

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
