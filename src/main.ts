import readline from "readline"; // New import for shared rl
import { FileOpsService } from "./file-ops";
import { ConfigService } from "./config";
import { LlmService } from "./llm";
import { CommandService } from "./commands";
import { StorageService } from "./storage";
import { ReplOrchestrator } from "./repl-orchestrator";
import { LoggerService } from "./logger";
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
  ReadFileTool,
} from "./tools/file";
import { ChatHistoryService } from "./services/chat-history.service";
import { ToolMapperService } from "./services/tool-mapper.service";
import { EventManager } from "./events/event-manager";
import { StorageListener } from "./events/storage-listener";
import { Agent } from "./services/agent.service";
import { ParseChatMessage } from "./types";

import fs from "fs";
import path from "path";
import { UserApprovalService } from "./services/user-approval.service";
const SYSTEM_PROMPT = fs
  .readFileSync(path.resolve(__dirname, "./prompts/main_agent.md"))
  .toString();

// Bootstrap: Create instances with DI chain
const logger = new LoggerService();
const fileOpsService = new FileOpsService();
const configService = new ConfigService(fileOpsService, logger);
const xaiProvider = new XaiProvider(configService, logger);
const toolRegistry = new ToolRegistry();

const toolMapperService = new ToolMapperService(toolRegistry);
const llmService = new LlmService(
  xaiProvider,
  configService,
  logger,
  toolMapperService,
  SYSTEM_PROMPT
);
const commandService = new CommandService(configService, fileOpsService);
const storageService = new StorageService(configService);

const eventManager = new EventManager(logger);
const storageListener = new StorageListener(storageService, logger);

eventManager.subscribe<ParseChatMessage>(
  ChatHistoryService.NEW_MESSAGE_EVENT,
  storageListener.handleEvent
);

const chatHistoryService = new ChatHistoryService(eventManager, logger);

// Register file tools
toolRegistry.register(new CreateFileTool(fileOpsService));
toolRegistry.register(new EditFileTool(fileOpsService));
toolRegistry.register(new ListDirTool(fileOpsService));
toolRegistry.register(new FindFileTool(fileOpsService));
toolRegistry.register(new RenameFileTool(fileOpsService));
toolRegistry.register(new DeleteFileTool(fileOpsService));
toolRegistry.register(new TreeDirTool(fileOpsService));
toolRegistry.register(new ReadFileTool(fileOpsService));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Parse > ",
});

const userApprovalService = new UserApprovalService(rl);

const agent = new Agent(
  llmService,
  chatHistoryService,
  toolRegistry,
  logger,
  userApprovalService
);

const orchestrator = new ReplOrchestrator(
  configService,
  commandService,
  storageService,
  logger,
  agent,
  rl
);
orchestrator.start();
