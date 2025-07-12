import readline from "readline";
import { commands } from "./commands";
import { getConfig, loadConfig } from "./config";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Parse > ",
});

async function main() {
  try {
    await loadConfig();
    const config = getConfig();
    console.log(`Authenticated with ${config ? config.provider : "unknown"}.`);
  } catch (err: unknown) {
    const message = (err as Error).message;
    if (message.startsWith("Invalid API key")) {
      console.log(message + " Use /login to update.");
    } else if (message.startsWith("Config not found")) {
      console.log("No authentication found. Use /login <provider> <apiKey>.");
    } else {
      console.log(`Startup error: ${message}`);
    }
  }
  rl.prompt();
  rl.on("line", async (line) => {
    const input = line.trim();
    if (input === "") {
      rl.prompt();
      return;
    }
    if (!input.startsWith("/")) {
      console.log(`Echo: ${input}`);
      rl.prompt();
      return;
    }

    const parts = input.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const handler = commands[cmd];
    if (handler) {
      const result = await handler(args);
      if (result) console.log(result);
    } else {
      console.log(`Unknown command: /${cmd}. Use /help.`);
    }

    if (cmd !== "quit" && cmd !== "exit") rl.prompt();
  });
}

main();
