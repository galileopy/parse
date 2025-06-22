import { Drivers, setup } from "@cycle/run";
import { FileDriver, makeFileOperationDriver } from "./drivers/files";
import { HTTPDriver, makeHTTPDriver } from "./drivers/http";
import { makeREPLDriver, REPLDriver } from "./drivers/repl";
import {
  makeTerminationDriver,
  TerminationDriver,
} from "./drivers/termination";
import { main } from "./main";
interface AppDrivers extends Drivers {
  REPL: REPLDriver;
  Files: FileDriver;
  Termination: TerminationDriver;
  HTTP: HTTPDriver;
}

// Define drivers with explicit typing
const drivers: AppDrivers = {
  REPL: makeREPLDriver(),
  Files: makeFileOperationDriver(),
  Termination: makeTerminationDriver(),
  HTTP: makeHTTPDriver(),
};

// Run the Cycle.js application
const { sources, sinks, run } = setup(main, drivers);
const dispose = run(); // Executes the application

export { dispose, sinks, sources };

