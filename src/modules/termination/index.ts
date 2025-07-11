import { inputFilter, inputToCommand } from "./api";
import { makeTerminationDriver } from "./driver";

export type * from "./types";

export const TerminationModule = {
  inputFilter,
  inputToCommand,
  makeDriver: makeTerminationDriver,
};
