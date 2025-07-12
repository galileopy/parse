import { CommandHandler } from "./types";
import { readFile, writeFile } from "./file-ops";
import { saveConfig } from "./config";

const helpData: Record<string, string[]> = {
  read: ["Usage: /read <path>", "Reads the file at the given path."],
  write: ["Usage: /write <path> <content>", "Writes content to the file."],
  help: ["Usage: /help [command]", "Shows help for commands."],
  quit: ["Usage: /quit", "Exits the app."],
  login: ["Usage: /login <provider> <apiKey>", "Saves auth config."],
};

/**
 * Handles /read command.
 * @param args - Command arguments.
 * @returns Result string.
 */
async function handleRead(args: string[]): Promise<string> {
  if (args.length !== 1) return "Invalid: /read <path>";
  return await readFile(args[0]);
}

/**
 * Handles /write command.
 * @param args - Command arguments.
 * @returns Result string.
 */
async function handleWrite(args: string[]): Promise<string> {
  if (args.length < 2) return "Invalid: /write <path> <content>";
  const pathArg = args[0].trim();
  const content = args.slice(1).join(" ").trim();
  return await writeFile(pathArg, content);
}

/**
 * Handles /help command.
 * @param args - Command arguments.
 * @returns Help text.
 */
async function handleHelp(args: string[]): Promise<string> {
  if (args.length === 0) {
    return Object.entries(helpData)
      .map(([cmd, desc]) => `/${cmd}:\n\t${desc.join("\n\t")}`)
      .join("\n\n");
  }
  const specific = args.map((arg) => arg.trim()).join("|");
  const helps = specific
    .split("|")
    .map((cmd) =>
      helpData[cmd]
        ? `/${cmd}:\n\t${helpData[cmd].join("\n\t")}`
        : `No help for ${cmd}`
    );
  return helps.join("\n\n");
}

/**
 * Handles /login command.
 * @param args - Command arguments.
 * @returns Result string.
 */
async function handleLogin(args: string[]): Promise<string> {
  if (args.length !== 2) return "Invalid: /login <provider> <apiKey>";
  try {
    await saveConfig(args[0].trim(), args[1].trim());
    return "Auth saved and validated successfully.";
  } catch (err: unknown) {
    return `Error saving auth: ${(err as Error).message}`;
  }
}
/**
 * Handles /quit or /exit.
 * @returns Void (exits process).
 */
async function handleQuit(): Promise<void> {
  process.exit(0);
}

export const commands: Record<string, CommandHandler> = {
  read: handleRead,
  write: handleWrite,
  help: handleHelp,
  login: handleLogin,
  quit: handleQuit,
  exit: handleQuit,
};
