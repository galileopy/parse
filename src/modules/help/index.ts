import { inputToCommand, inputFilter } from "./api";
import { helpOutput } from "./api";

export const HelpModule = {
  inputFilter,
  inputToCommand,
  commandToOutput: helpOutput,
};
