// ═══════════════════════════════════════════════════════════════
// Enhanced Store — agents, debates, ideas, tasks, notifications, models
// ═══════════════════════════════════════════════════════════════

import {
  Agent, DebateSession, Idea, Task, ToolCall, LLMModel,
  Notification, AgentConnection, TaskStatus, TaskPriority, IdeaStatus,
} from "./types";
import { DEFAULT_AGENTS, createAgentFromTemplate, AGENT_TEMPLATES } from "./agents";

// ── Agents ──────────────────────────────────────────────────────
let agents: Agent[] = DEFAULT_AGENTS.map((a, i) => ({
  ...a,
  x: 100 + (i % 4) * 260,
  y: 80 + Math.floor(i / 4) * 200,
}));

// ── Connections ─────────────────────────────────────────────────
const defaultConnections: AgentConnection[] = [
  { id: "c1", from: agents[0]?.id || "", to: agents[1]?.id || "", label: "challenges" },
  { id: "c2", from: agents[1]?.id || "", to: agents[2]?.id || "", label: "informs" },
  { id: "c3", from: agents[2]?.id || "", to: agents[3]?.id || "", label: "synthesizes" },
  { id: "c4", from: agents[3]?.id || "", to: agents[0]?.id || "", label: "grounds" },
  { id: "c5", from: agents[4]?.id || "", to: agents[5]?.id || "", label: "facilitates" },
  { id: "c6", from: agents[5]?.id || "", to: agents[6]?.id || "", label: "provokes" },
  { id: "c7", from: agents[6]?.id || "", to: agents[7]?.id || "", label: "analyzes" },
];

// ── Tasks ───────────────────────────────────────────────────────
let tasks: Task[] = [
  {
    id: "task_1", title: "Design agent communication protocol",
    description: "Define the message format and routing logic for inter-agent communication",
    status: "in_progress", priority: "high", assignee: "Atlas",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_2", title: "Implement tool calling sandbox",
    description: "Set up isolated execution environment for agent tool calls",
    status: "todo", priority: "critical", assignee: "Meridian",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_3", title: "Write debate evaluation metrics",
    description: "Define quality metrics for debate outputs — coherence, novelty, factual accuracy",
    status: "todo", priority: "normal", assignee: "Cipher",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_4", title: "Review security implications of agent tool access",
    description: "Audit all tool endpoints for injection, privilege escalation, data leakage",
    status: "done", priority: "high", assignee: "Socrates",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "task_5", title: "Build idea export pipeline",
    description: "Export approved ideas as structured JSON, Markdown, or PDF",
    status: "todo", priority: "low", assignee: "Thesis",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── Notifications ───────────────────────────────────────────────
let notifications: Notification[] = [
  {
    id: "n1", type: "success", title: "Debate Completed",
    message: "Round 4 debate on 'AI Orchestration' finished with 3 new ideas.",
    timestamp: new Date(Date.now() - 600000).toISOString(), read: false,
  },
  {
    id: "n2", type: "info", title: "Agent Atlas Updated",
    message: "Model changed to claude-sonnet-4-20250514",
    timestamp: new Date(Date.now() - 1800000).toISOString(), read: false,
  },
  {
    id: "n3", type: "warning", title: "Memory Pressure",
    message: "System memory at 72%. Consider unloading idle models.",
    timestamp: new Date(Date.now() - 3600000).toISOString(), read: true,
  },
];

// ── LLM Models ──────────────────────────────────────────────────
const models: LLMModel[] = [
  { id: "anthropic/claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic", contextLength: 200000 },
  { id: "anthropic/claude-haiku-4-20250514", name: "Claude Haiku 4", provider: "Anthropic", contextLength: 200000 },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", contextLength: 128000 },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", contextLength: 128000 },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", contextLength: 1000000 },
  { id: "google/gemini-2.0-pro", name: "Gemini 2.0 Pro", provider: "Google", contextLength: 2000000 },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", contextLength: 1000000 },
  { id: "meta-llama/llama-4-scout", name: "Llama 4 Scout", provider: "Meta", contextLength: 10000000 },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek", contextLength: 65536 },
  { id: "deepseek/deepseek-reasoner", name: "DeepSeek R1", provider: "DeepSeek", contextLength: 65536 },
  { id: "x-ai/grok-3", name: "Grok 3", provider: "xAI", contextLength: 131072 },
  { id: "x-ai/grok-3-mini", name: "Grok 3 Mini", provider: "xAI", contextLength: 131072 },
  { id: "mistralai/mistral-large-2", name: "Mistral Large 2", provider: "Mistral", contextLength: 131072 },
  { id: "qwen/qwen-3-235b", name: "Qwen 3 235B", provider: "Alibaba", contextLength: 131072 },
];

export const store = {
  agents: {
    list: () => [...agents],
    get: (id: string) => agents.find((a) => a.id === id) || null,
    create: (agent: Agent) => { agents.push(agent); return agent; },
    update: (id: string, updates: Partial<Agent>) => {
      const idx = agents.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      agents[idx] = { ...agents[idx], ...updates };
      return agents[idx];
    },
    remove: (id: string) => {
      const idx = agents.findIndex((a) => a.id === id);
      if (idx === -1) return false;
      agents.splice(idx, 1);
      return true;
    },
    reset: () => { agents = DEFAULT_AGENTS.map((a, i) => ({ ...a, x: 100 + (i % 4) * 260, y: 80 + Math.floor(i / 4) * 200 })); },
  },

  connections: {
    list: () => [...defaultConnections],
    create: (conn: AgentConnection) => { defaultConnections.push(conn); },
    remove: (id: string) => {
      const idx = defaultConnections.findIndex((c) => c.id === id);
      if (idx !== -1) defaultConnections.splice(idx, 1);
    },
  },

  debates: {
    sessions: new Map<string, DebateSession>(),
    create(session: DebateSession) { this.sessions.set(session.id, session); return session; },
    get(id: string) { return this.sessions.get(id) || null; },
    update(id: string, updates: Partial<DebateSession>) {
      const s = this.sessions.get(id);
      if (!s) return null;
      const updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
      this.sessions.set(id, updated);
      return updated;
    },
    list() {
      return Array.from(this.sessions.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
    delete(id: string) { return this.sessions.delete(id); },
  },

  ideas: {
    all(): Idea[] {
      const ideas: Idea[] = [];
      store.debates.sessions.forEach((s) => ideas.push(...s.ideas));
      return ideas.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    updateStatus(ideaId: string, status: IdeaStatus) {
      for (const session of store.debates.sessions.values()) {
        const idea = session.ideas.find((i) => i.id === ideaId);
        if (idea) { idea.status = status; if (status === "approved") idea.votes++; return idea; }
      }
      return null;
    },
  },

  tasks: {
    list: () => [...tasks],
    get: (id: string) => tasks.find((t) => t.id === id) || null,
    create: (task: Task) => { tasks.push(task); return task; },
    update: (id: string, updates: Partial<Task>) => {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
      return tasks[idx];
    },
    remove: (id: string) => {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      tasks.splice(idx, 1); return true;
    },
    updateStatus: (id: string, status: TaskStatus) => {
      const task = store.tasks.get(id);
      if (!task) return null;
      return store.tasks.update(id, { status });
    },
  },

  notifications: {
    list: () => [...notifications],
    unreadCount: () => notifications.filter((n) => !n.read).length,
    add: (n: Notification) => { notifications.unshift(n); if (notifications.length > 50) notifications.pop(); },
    markRead: (id: string) => {
      const n = notifications.find((x) => x.id === id);
      if (n) n.read = true;
    },
    markAllRead: () => { notifications.forEach((n) => { n.read = true; }); },
  },

  models: {
    list: () => [...models],
    get: (id: string) => models.find((m) => m.id === m.id) || null,
  },

  toolCalls: {
    calls: new Map<string, ToolCall[]>(),
    add(sessionId: string, call: ToolCall) {
      const existing = this.calls.get(sessionId) || [];
      existing.push(call);
      this.calls.set(sessionId, existing);
    },
    forSession(sessionId: string) { return this.calls.get(sessionId) || []; },
    update(sessionId: string, callId: string, updates: Partial<ToolCall>) {
      const calls = this.calls.get(sessionId) || [];
      const idx = calls.findIndex((c) => c.id === callId);
      if (idx === -1) return null;
      calls[idx] = { ...calls[idx], ...updates };
      return calls[idx];
    },
  },
};
