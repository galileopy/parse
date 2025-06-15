import { Drivers, setup } from "@cycle/run";
import { makeREPLDriver, REPLDriver } from "./drivers/repl";
import { main } from "./main";

interface AppDrivers extends Drivers {
  REPL: REPLDriver;
}

// Define drivers with explicit typing
const drivers: AppDrivers = {
  REPL: makeREPLDriver(),
};

// Run the Cycle.js application
const { sources, sinks, run } = setup(main, drivers);
const dispose = run(); // Executes the application

export { sources, sinks, dispose };
