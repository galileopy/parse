import { FileOpsService } from "./file-ops";
import { ConfigService } from "./config";
import { LlmService } from "./llm";
import { CommandService } from "./commands";
import { StorageService } from "./storage";
import { ReplOrchestrator } from "./repl-orchestrator";
import { LoggerService } from "./logger"; // New import
import { XaiProvider } from "./providers/xai/xai.provider";
import { ToolRegistry } from "./tools/protocol";
import {
  CreateFileTool,
  EditFileTool,
  ListDirTool,
  FindFileTool,
  RenameFileTool,
  DeleteFileTool,
  TreeDirTool,
} from "./tools/file";

// Bootstrap: Create instances with DI chain
const logger = new LoggerService();
const fileOpsService = new FileOpsService();
const configService = new ConfigService(fileOpsService, logger);
const xaiProvider = new XaiProvider(configService, logger);
const toolRegistry = new ToolRegistry();

const llmService = new LlmService(
  xaiProvider,
  configService,
  logger,
  toolRegistry
);
const commandService = new CommandService(configService, fileOpsService);
const storageService = new StorageService(configService);

// Register file tools
toolRegistry.register(new CreateFileTool(fileOpsService));
toolRegistry.register(new EditFileTool(fileOpsService));
toolRegistry.register(new ListDirTool(fileOpsService));
toolRegistry.register(new FindFileTool(fileOpsService));
toolRegistry.register(new RenameFileTool(fileOpsService));
toolRegistry.register(new DeleteFileTool(fileOpsService));
toolRegistry.register(new TreeDirTool(fileOpsService));

const orchestrator = new ReplOrchestrator(
  configService,
  llmService,
  commandService,
  storageService,
  logger,
  toolRegistry
);
orchestrator.start();
