import {
  IChatHistoryService,
  IEventManager,
  ILoggerService,
  ParseChatMessage,
} from "../types";

export class ChatHistoryService implements IChatHistoryService {
  private history: ParseChatMessage[] = [];
  public static readonly NEW_MESSAGE_EVENT = "new-message";

  constructor(
    private eventManager: IEventManager,
    private logger: ILoggerService
  ) {}

  append(message: ParseChatMessage): void {
    this.history.push(message);
    this.eventManager
      .emit(ChatHistoryService.NEW_MESSAGE_EVENT, message)
      .catch((err) => {
        this.logger.error(`Event emission failed: ${err.message}`);
      });
  }

  read(): ParseChatMessage[] {
    return [...this.history];
  }
}
