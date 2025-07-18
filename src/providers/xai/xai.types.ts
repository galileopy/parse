// Top-level interfaces for xAI API request and response formats.
// Nested structures are extracted to separate top-level interfaces for clarity.

export interface ChatMessage {
  role: string;
  content: string;
  tool_calls?: ToolCall[]
}

export interface ResponseFormatItem {
  type: string;
  json_schema?: unknown | null;
}

export interface SearchParameters {
  from_date?: string | null;
  max_search_results?: number | null;
  mode?: string | null;
  return_citations?: boolean | null;
  sources?: unknown[] | null;
  to_date?: string | null;
}

export interface StreamOptions {
  include_usage: boolean;
}

export interface ToolCallFunction {
  name: string;
  arguments: string; // JSON string of args
}

export interface ToolCall {
  id: string;
  type: "function";
  function: ToolCallFunction;
}

export interface ToolChoiceFunction {
  name: string;
}

export interface ToolChoiceObject {
  function?: ToolChoiceFunction | null;
  type: string;
}

export type ToolChoice = "none" | "auto" | "required" | ToolChoiceObject;

export interface WebSearchOptions {
  search_context_size?: number | null;
  user_location?: string | null;
}
export interface ToolFunction {
  name: string;
  description?: string;
  parameters?: unknown; // JSON Schema
}

export interface Tool {
  // Inferred basic structure; expand as per xAI docs if needed
  type: "function";
  function: ToolFunction;
}

export interface ChatCompletionRequest {
  deferred?: boolean | null;
  frequency_penalty?: number | null;
  logit_bias?: Record<string, number> | null; // Assuming map for logit_bias
  logprobs?: boolean | null;
  max_completion_tokens?: number | null;
  max_tokens?: number | null;
  messages: ChatMessage[];
  model: string;
  n?: number | null;
  parallel_function_calling?: boolean | null;
  presence_penalty?: number | null;
  reasoning_effort?: number | null; // Assuming numeric effort level
  response_format?: ResponseFormatItem[] | null;
  search_parameters?: SearchParameters | null;
  seed?: number | null;
  stop?: string | string[] | null;
  stream?: boolean | null;
  stream_options?: StreamOptions | null;
  temperature?: number | null;
  tool_choice?: ToolChoice | null;
  tools?: Tool[] | null;
  top_logprobs?: number | null;
  top_p?: number | null;
  user?: string | null;
  web_search_options?: WebSearchOptions | null;
}

export interface CompletionTokensDetails {
  accepted_prediction_tokens: number;
  audio_tokens: number;
  reasoning_tokens: number;
  rejected_prediction_tokens: number;
}

export interface PromptTokensDetails {
  audio_tokens: number;
  cached_tokens: number;
  image_tokens: number;
  text_tokens: number;
}

export interface Usage {
  completion_tokens: number;
  completion_tokens_details: CompletionTokensDetails;
  num_sources_used: number;
  prompt_tokens: number;
  prompt_tokens_details: PromptTokensDetails;
  total_tokens: number;
}

export interface DebugOutput {
  attempts: number;
  cache_read_count: number;
  cache_read_input_bytes: number;
  cache_write_count: number;
  cache_write_input_bytes: number;
  prompt: string;
  request: string;
  responses: string[];
}

export interface Citation {
  // Inferred; expand based on actual citations structure
  url: string;
  title: string;
  snippet?: string;
}

export interface ChatCompletionChoice {
  // Structure inferred; example shows empty array
  index?: number;
  message: ChatMessage;
  finish_reason?: string;
  ; // Added for tool calling
}

export interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
  citations?: Citation[] | null;
  created: number;
  debug_output?: DebugOutput | null;
  id: string;
  model: string;
  object: string;
  system_fingerprint?: string | null;
  usage?: Usage | null;
}

export interface ApiKeyResponse {
  acls: string[];
  api_key_blocked: boolean;
  api_key_disabled: boolean;
  api_key_id: string;
  create_time: string;
  modified_by: string;
  modify_time: string;
  name: string;
  redacted_api_key: string;
  team_blocked: boolean;
  team_id: string;
  user_id: string;
}

export interface Model {
  id: string;
  created: number;
  object: string;
  owned_by: string;
}

export interface ModelsResponse {
  data: Model[];
  object: string;
}
