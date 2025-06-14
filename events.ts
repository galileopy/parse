export interface BaseEvent {
  type: string;
  payload: unknown;
}

export interface UserInputEvent extends BaseEvent {
  type: "UserInput";
  payload: { text: string; timestamp: number };
}

export interface LLMResponseEvent extends BaseEvent {
  type: "LLMResponse";
  payload: { response: string; requestId: string };
}

export interface ToolCallEvent extends BaseEvent {
  type: "ToolCall";
  payload: { toolName: string; args: unknown };
}

export interface ToolSetupEvent extends BaseEvent {
  type: "ToolSetup";
  payload: { toolName: string; config: unknown };
}

export interface RequestUserApprovalEvent extends BaseEvent {
  type: "RequestUserApproval";
  payload: { message: string; requestId: string };
}

export interface CommandEvent extends BaseEvent {
  type: "Command";
  payload: {
    command: "login" | "exit" | "clear" | "free" | "model";
    args?: unknown[];
  };
}

// Extensible union type
export type ParseEvent =
  | UserInputEvent
  | LLMResponseEvent
  | ToolCallEvent
  | ToolSetupEvent
  | RequestUserApprovalEvent
  | CommandEvent;
