import { HelpOperation } from "./types";

export const inputToCommand = (input: string): HelpOperation => {
  return { command: "help", specific: input.trim().split(" ")[1] };
};

export const inputFilter = (input: string): boolean =>
  input.startsWith("/help") || input.startsWith("\\");

const helpData: Record<string, string[]> = {
  read: [
    "Usage: /read <path>",
    "Reads the file at the given path and displays its content.",
  ],
  write: [
    "Usage: /write <path> <content>",
    "Writes the provided content to the file at the given path.",
  ],
  quit: ["Usage: /quit", "Exits the Parse application."],
  help: [
    "Usage: /help [command]",
    "Displays help information for all commands or a specific command if provided.",
  ],
};

function getSpecificHelp(input: string): string {
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

function getAllHelp(): string {
  return Object.entries(helpData)
    .map(([cmd, desc]) => `  /${cmd}:\n\t${desc.join("\n\t")}`)
    .join("\n\n")
    .concat("\n");
}

export const helpOutput = (operation: HelpOperation): string => {
  return operation.specific
    ? getSpecificHelp(operation.specific)
    : getAllHelp();
};
