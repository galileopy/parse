import { inputFilter, inputToCommand, resultToOutput } from "./api";
import { makeFileOperationDriver } from "./driver";

export type * from "./types";

export const FileOperationModule = {
  inputFilter,
  inputToCommand,
  resultToOutput,
  makeDriver: makeFileOperationDriver,
};
