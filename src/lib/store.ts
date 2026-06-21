// ═══════════════════════════════════════════════════════════════
// In-Memory Store (swap for Vercel KV / Postgres in production)
// ═══════════════════════════════════════════════════════════════

import { Agent, DebateSession, Idea, ToolCall } from "./types";
import { DEFAULT_AGENTS } from "./agents";

// Agents
let agents: Agent[] = [...DEFAULT_AGENTS];

export const store = {
  agents: {
    list: () => [...agents],
    get: (id: string) => agents.find((a) => a.id === id) || null,
    create: (agent: Agent) => {
      agents.push(agent);
      return agent;
    },
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
    reset: () => {
      agents = [...DEFAULT_AGENTS];
    },
  },

  debates: {
    sessions: new Map<string, DebateSession>(),

    create(session: DebateSession) {
      this.sessions.set(session.id, session);
      return session;
    },

    get(id: string) {
      return this.sessions.get(id) || null;
    },

    update(id: string, updates: Partial<DebateSession>) {
      const s = this.sessions.get(id);
      if (!s) return null;
      const updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
      this.sessions.set(id, updated);
      return updated;
    },

    list() {
      return Array.from(this.sessions.values()).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },

    delete(id: string) {
      return this.sessions.delete(id);
    },
  },

  ideas: {
    all(): Idea[] {
      const ideas: Idea[] = [];
      store.debates.sessions.forEach((s) => ideas.push(...s.ideas));
      return ideas.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },

    updateStatus(ideaId: string, status: Idea["status"]) {
      for (const session of store.debates.sessions.values()) {
        const idea = session.ideas.find((i) => i.id === ideaId);
        if (idea) {
          idea.status = status;
          if (status === "approved") idea.votes++;
          if (status === "rejected") idea.votes = Math.max(0, idea.votes - 1);
          return idea;
        }
      }
      return null;
    },
  },

  toolCalls: {
    calls: new Map<string, ToolCall[]>(),

    add(sessionId: string, call: ToolCall) {
      const existing = this.calls.get(sessionId) || [];
      existing.push(call);
      this.calls.set(sessionId, existing);
    },

    update(sessionId: string, callId: string, updates: Partial<ToolCall>) {
      const calls = this.calls.get(sessionId) || [];
      const idx = calls.findIndex((c) => c.id === callId);
      if (idx === -1) return null;
      calls[idx] = { ...calls[idx], ...updates };
      return calls[idx];
    },

    forSession(sessionId: string) {
      return this.calls.get(sessionId) || [];
    },
  },
};
