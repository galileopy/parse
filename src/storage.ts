import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { IConfigService, IStorageService, ParseChatEntry } from "./types";

export class StorageService implements IStorageService {
  private db!: Low<{ chats: ParseChatEntry[] }>;

  constructor(private configService: IConfigService) {}

  async initDb(): Promise<void> {
    const adapter = new JSONFile<{ chats: ParseChatEntry[] }>(
      `${this.configService.getConfigDir()}/history.json`
    );
    this.db = new Low(adapter, { chats: [] });
    await this.db.read();
  }

  async saveSession(entry: ParseChatEntry): Promise<void> {
    this.db.data.chats.push(entry);
    await this.db.write();
  }

  async getChats(): Promise<ParseChatEntry[]> {
    await this.db.read(); // Ensure fresh read
    return this.db.data.chats;
  }
}
