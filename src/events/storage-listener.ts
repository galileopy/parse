import {
  IStorageService,
  ILoggerService,
  ParseChatMessage,
  ParseChatEntry,
  ParseEventHandler,
} from "../types";

export class StorageListener {
  constructor(
    private storageService: IStorageService,
    private logger: ILoggerService
  ) {}

  handleEvent: ParseEventHandler<ParseChatMessage> = async (
    data: ParseChatMessage
  ) => {
    try {

      const entry: ParseChatEntry = {
        sessionId: Date.now().toString(), 
        messages: [data],
      };

      await this.storageService.saveSession(entry);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Storage failed: ${error.message}`);
      throw error; 
    }
  };
}
