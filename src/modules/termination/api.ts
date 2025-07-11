import { TerminationCommand } from "./types";

export const inputFilter = (input: string): boolean =>
  ["/quit", "/exit"].includes(input.trim());

export const inputToCommand = () =>
  ({ command: "quit" as const }) as TerminationCommand;
