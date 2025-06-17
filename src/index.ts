import { Drivers, setup } from "@cycle/run";
import { makeREPLDriver, REPLDriver } from "./drivers/repl";
import { FileDriver, makeFileOperationDriver } from "./drivers/files";
import {
  makeTerminationDriver,
  TerminationDriver,
} from "./drivers/termination";
import { main } from "./main";

interface AppDrivers extends Drivers {
  REPL: REPLDriver;
  Files: FileDriver;
  Termination: TerminationDriver;
}

// Define drivers with explicit typing
const drivers: AppDrivers = {
  REPL: makeREPLDriver(),
  Files: makeFileOperationDriver(),
  Termination: makeTerminationDriver(),
};

// Run the Cycle.js application
const { sources, sinks, run } = setup(main, drivers);
const dispose = run(); // Executes the application

export { sources, sinks, dispose };
