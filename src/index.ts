import { Drivers, setup } from "@cycle/run";

import { FileDriver, FileOperationModule } from "./modules/files";
import { REPLDriver, REPLModule } from "./modules/repl";
import {
  TerminationModule,
  type TerminationDriver,
} from "./modules/termination";

import { main } from "./main";
interface AppDrivers extends Drivers {
  REPL: REPLDriver;
  Files: FileDriver;
  Termination: TerminationDriver;
}

// Define drivers with explicit typing
const drivers: AppDrivers = {
  REPL: REPLModule.makeDriver(),
  Files: FileOperationModule.makeDriver(),
  Termination: TerminationModule.makeDriver(),
};

// Run the Cycle.js application
const { sources, sinks, run } = setup(main, drivers);
const dispose = run(); // Executes the application

export { dispose, sinks, sources };
