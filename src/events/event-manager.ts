import { IEventManager, ILoggerService, ParseEventHandler } from "../types";

export class EventManager implements IEventManager {
  private subscribers: Map<string, Set<ParseEventHandler<never>>> = new Map();
  private maxRetries = 3;
  private readonly INITIAL_WAIT_TIME = 1000;

  constructor(private logger: ILoggerService) {}

  subscribe<T>(eventType: string, listener: ParseEventHandler<T>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(listener as ParseEventHandler<T>);
  }

  unsubscribe<T>(eventType: string, listener: ParseEventHandler<T>): void {
    this.subscribers.get(eventType)?.delete(listener);
  }

  async emit<T>(
    eventType: string,
    data: T,
    options?: { initialWaitTime: number }
  ): Promise<void> {
    const listeners = this.subscribers.get(eventType);
    if (!listeners) {
      return;
    }

    const initialWaitTime = options?.initialWaitTime ?? this.INITIAL_WAIT_TIME;

    for (const listener of listeners) {
      let attempt = 0;
      while (attempt < this.maxRetries) {
        try {
          await (listener as ParseEventHandler<T>)(data);
          break;
        } catch (err: unknown) {

          const exponent = Math.pow(2, attempt);
          const waitTime = initialWaitTime * exponent;
          const error = err instanceof Error ? err : new Error(String(err));

          attempt++;

          this.logger.warn(
            `Retry ${attempt} for listener on ${eventType}: ${error.message}`
          );

          if (attempt === this.maxRetries) {
            this.logger.error(`Failed after retries: ${error.message}`);
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }
}
