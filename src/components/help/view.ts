import { Stream } from "xstream";
import { helpData } from "./data";
import { HelpOperation } from "./types";
import { ApplicationOutput } from "../../types";

export function getSpecificHelp(input: string): string {
  const commands = input.split("|").map((cmd) => cmd.trim());
  const helps = commands.map((cmd) => {
    const lines = helpData[cmd];
    if (lines) {
      return `  /${cmd}:\n\t${lines.join("\n\t")}`;
    } else {
      return `No help found for command: ${cmd}`;
    }
  });
  return helps.join("\n\n").concat("\n");
}

export function getAllHelp(): string {
  return Object.entries(helpData)
    .map(([cmd, desc]) => `  /${cmd}:\n\t${desc.join("\n\t")}`)
    .join("\n\n")
    .concat("\n");
}

export function commandToOutput(operation: HelpOperation): string {
  return operation.specific
    ? getSpecificHelp(operation.specific)
    : getAllHelp();
}

export function view(actions: Stream<HelpOperation>): ApplicationOutput {
  return {
    output$: actions.map(commandToOutput),
  };
}
