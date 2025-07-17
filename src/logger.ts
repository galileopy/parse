import { ILoggerService } from "./types";

export class LoggerService implements ILoggerService {
  log(message: string): void {
    console.log(message);
  }
  
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  debug(message: string): void {
    if (process.env.DEBUG === "true") {
      // Enable via env var for production control
      console.log(`[DEBUG] ${message}`);
    }
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }
}
