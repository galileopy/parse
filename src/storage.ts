import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { IConfigService, IStorageService } from "./types";
import { xAIChatEntry } from "providers/types";

export class StorageService implements IStorageService {
  private db!: Low<{ chats: xAIChatEntry[] }>;

  constructor(private configService: IConfigService) {}

  async initDb(): Promise<void> {
    const adapter = new JSONFile<{ chats: xAIChatEntry[] }>(
      `${this.configService.getConfigDir()}/history.json`
    );
    this.db = new Low(adapter, { chats: [] });
    await this.db.read();
  }

  async saveSession(entry: xAIChatEntry): Promise<void> {
    this.db.data.chats.push(entry);
    await this.db.write();
  }


  async getChats(): Promise<xAIChatEntry[]> {
    await this.db.read(); // Ensure fresh read
    return this.db.data.chats;
  }
}
