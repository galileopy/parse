import xs, { Stream } from "xstream";
import { createInterface, Interface } from "readline";
import { REPLDriver, REPLSources } from "./types";

// Make the REPL driver
export function makeDriver(): REPLDriver {
  return function REPLDriver(sink: Stream<string>): REPLSources {
    // Create readline interface
    const rl: Interface = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "Parse > ",
    });

    // Create Line source stream from user input
    const line$ = xs.create<string>({
      start(listener) {
        rl.on("line", (input: string) => {
          listener.next(input.trim());
        });
      },
      stop() {
        rl.close();
      },
    });

    // Subscribe to sink.Line to print messages
    sink.addListener({
      next(message: string) {
        console.log(message);
        rl.prompt(); // Show prompt after output
      },
    });

    // Show initial prompt
    rl.prompt();

    return {
      Line: line$,
    };
  };
}
