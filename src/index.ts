import { setup } from "@cycle/run";

function main() {}
const drivers = {};
const { sources, sinks, run } = setup(main, drivers);
const dispose = run(); // Executes the application

export { sources, sinks, dispose };
