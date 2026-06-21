// ═══════════════════════════════════════════════════════════════
// Core Types for the Orchestrator Multi-Agent System
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

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  icon: string;
  color: string;
  model: string; // e.g. "openrouter/anthropic/claude-sonnet-4"
  provider: string; // e.g. "openrouter", "anthropic", "openai"
  personality: string;
  specialty: string;
  tools: string[]; // tool IDs the agent can use
  score: number;
  createdAt: string;
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
  agents: string[]; // agent IDs
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

// API request/response types

export interface StartDebateRequest {
  topic: string;
  agentIds: string[];
  maxRounds?: number;
}

export interface AgentMessageRequest {
  sessionId: string;
  agentId: string;
  message: string;
}

export interface VoteIdeaRequest {
  ideaId: string;
  action: "approve" | "reject" | "upvote";
}
