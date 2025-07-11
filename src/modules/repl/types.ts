import { Driver } from "@cycle/run";
import { Stream } from "xstream";


// Define types for driver streams

export interface REPLSources {
  Line: Stream<string>;
}
// Define the driver type to match Cycle.js expectations

export type REPLDriver = Driver<Stream<string>, REPLSources>;
