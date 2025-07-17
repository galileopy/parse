import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { xAIChatEntry } from "./types";
import { getConfigDir } from "./config";

let db: Low<{ chats: xAIChatEntry[] }>;

export async function initDb() {
  const adapter = new JSONFile<{ chats: xAIChatEntry[] }>(
    `${getConfigDir()}/history.json`
  );
  db = new Low(adapter, { chats: [] });
  await db.read();
}

export async function saveSession(entry: xAIChatEntry) {
  db.data.chats.push(entry);
  await db.write();
}
