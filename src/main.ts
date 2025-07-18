import { FileOpsService } from "./file-ops";
import { ConfigService } from "./config";
import { LlmService } from "./llm";
import { CommandService } from "./commands";
import { StorageService } from "./storage";
import { ReplOrchestrator } from "./repl-orchestrator";
import { LoggerService } from "./logger"; // New import
import { XaiProvider } from "./providers/xai/xai.provider";

// Bootstrap: Create instances with DI chain
const logger = new LoggerService();
const fileOpsService = new FileOpsService();
const configService = new ConfigService(fileOpsService, logger);
const xaiProvider = new XaiProvider(configService, logger);
const llmService = new LlmService(xaiProvider, configService, logger);
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
