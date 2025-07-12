import { Drivers, setup } from "@cycle/run";

import FilesSystem, { FileDriver } from "./modules/filesystem";
import REPL, { REPLDriver } from "./modules/repl";
import Termination, { TerminationDriver } from "./modules/termination";

import { main } from "./main";
interface AppDrivers extends Drivers {
  REPL: REPLDriver;
  Files: FileDriver;
  Termination: TerminationDriver;
}

// Define drivers with explicit typing
const drivers: AppDrivers = {
  REPL: REPL.makeDriver(),
  Files: FilesSystem.makeDriver(),
  Termination: Termination.makeDriver(),
};

// Run the Cycle.js application
const { sources, sinks, run } = setup(main, drivers);
const dispose = run(); // Executes the application

export { dispose, sinks, sources };
