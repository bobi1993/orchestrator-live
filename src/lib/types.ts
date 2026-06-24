// ═══════════════════════════════════════════════════════════════
// Enhanced Types — matching the full local orchestrator feature set
// ═══════════════════════════════════════════════════════════════

export type AgentRole =
  | "Researcher"
  | "Critic"
  | "Innovator"
  | "Synthesizer"
  | "Domain Expert"
  | "Facilitator"
  | "Devil's Advocate"
  | "Analyst";

export type AgentStatus = "idle" | "thinking" | "speaking" | "tool_calling" | "offline";

export type IdeaStatus = "pending" | "approved" | "rejected";

export type DebatePhase = "idle" | "active" | "paused" | "completed";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  icon: string;
  color: string;
  model: string;
  provider: string;
  personality: string;
  specialty: string;
  tools: string[];
  score: number;
  createdAt: string;
  // n8n node position
  x?: number;
  y?: number;
}

export interface AgentConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  active?: boolean;
}

export interface DebateMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentIcon: string;
  agentColor: string;
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface Idea {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  status: IdeaStatus;
  timestamp: string;
  votes: number;
  tags: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "running" | "complete" | "error";
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface DebateSession {
  id: string;
  topic: string;
  phase: DebatePhase;
  agents: string[];
  messages: DebateMessage[];
  ideas: Idea[];
  toolCalls: ToolCall[];
  startedAt: string;
  updatedAt: string;
  maxRounds: number;
  currentRound: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: "search" | "code" | "file" | "media" | "document" | "data" | "web";
  icon: string;
  parameters: {
    name: string;
    type: "string" | "number" | "boolean" | "array";
    description: string;
    required: boolean;
  }[];
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  isFree: boolean;
  isLocal: boolean;
  pricing?: string;
  speed?: "fast" | "medium" | "slow";
}

export interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

export interface ServiceStatus {
  name: string;
  port: number;
  status: "running" | "stopped" | "error";
  url?: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ThemePreset {
  name: string;
  bg: string;
  accent: string;
}
