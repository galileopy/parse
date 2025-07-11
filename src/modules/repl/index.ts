import { makeREPLDriver } from "./driver";

export type * from "./types";

export const REPLModule = {
  makeDriver: makeREPLDriver,
};
