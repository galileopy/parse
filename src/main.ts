import readline from "readline";
import { commands } from "./commands";
import { getConfig, loadConfig } from "./config";
import { sendPrompt } from "./llm";
import { xAIChatMessage, xAIUsage } from "./types";
import { initDb, saveSession } from "./storage";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Parse > ",
});

const sessionHistory: xAIChatMessage[] = [];

const sessionUsage: xAIUsage = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};

async function main() {
  try {
    await loadConfig();
    await initDb();
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
      try {
        const {
          content,
          usage: { total_tokens, prompt_tokens, completion_tokens },
        } = await sendPrompt(input);
        const usage = { total_tokens, prompt_tokens, completion_tokens };
        console.log(`Response: ${content}`);

        sessionHistory.push(
          { role: "user", content: input },
          { role: "assistant", content, usage }
        );

        sessionUsage.total_tokens += usage.total_tokens;
        sessionUsage.prompt_tokens += usage.prompt_tokens;
        sessionUsage.completion_tokens = usage.completion_tokens;

        console.table({ usage, sessionUsage });
      } catch (err: unknown) {
        console.log((err as Error).message);
      }
      rl.prompt();
      return;
    }
    const parts = input.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "quit" || cmd === "exit") {
      await saveSession({
        sessionId: Date.now().toString(),
        messages: sessionHistory,
      });
    }

    const handler = commands[cmd];

    if (handler) {
      const result = await handler(args);
      if (result) {
        console.log(result);
      }
    } else {
      console.log(`Unknown command: /${cmd}. Use /help.`);
    }

    rl.prompt();
  });
}

main();
