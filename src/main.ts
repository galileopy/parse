import { FileOpsService } from "./file-ops";
import { ConfigService } from "./config";
import { LlmService } from "./llm";
import { CommandService } from "./commands";
import { StorageService } from "./storage";
import { ReplOrchestrator } from "./repl-orchestrator";
import { LoggerService } from "./logger"; // New import

// Bootstrap: Create instances with DI chain
const logger = new LoggerService();
const fileOpsService = new FileOpsService();
const configService = new ConfigService(fileOpsService, logger);
const llmService = new LlmService(configService, logger);
const commandService = new CommandService(configService, fileOpsService);
const storageService = new StorageService(configService);

const orchestrator = new ReplOrchestrator(
  configService,
  llmService,
  commandService,
  storageService,
  logger
);
orchestrator.start();
