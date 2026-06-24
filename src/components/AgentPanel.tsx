"use client";

import { useState } from "react";
import { Agent } from "@/lib/types";
import { AGENT_TEMPLATES } from "@/lib/agents";

interface Props {
  agents: Agent[];
  onRefresh: () => Promise<void>;
}

const MODEL_OPTIONS = [
  "anthropic/claude-sonnet-4-20250514",
  "anthropic/claude-haiku-4-20250514",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash",
  "meta-llama/llama-4-maverick",
  "deepseek/deepseek-chat",
  "x-ai/grok-3",
];

export function AgentPanel({ agents, onRefresh }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    role: "Researcher",
    name: "",
    model: "anthropic/claude-sonnet-4-20250514",
    provider: "openrouter",
  });

  const resetForm = () => {
    setForm({
      role: "Researcher",
      name: "",
      model: "anthropic/claude-sonnet-4-20250514",
      provider: "openrouter",
    });
    setEditingAgent(null);
    setShowCreate(false);
  };

  const createAgent = async () => {
    const template = AGENT_TEMPLATES.find((t) => t.role === form.role);
    if (!template) return;

    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        name: form.name || template.name,
      }),
    });
    resetForm();
    await onRefresh();
  };

  const updateAgent = async () => {
    if (!editingAgent) return;
    await fetch(`/api/agents/${editingAgent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    resetForm();
    await onRefresh();
  };

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    await onRefresh();
  };

  const startEdit = (agent: Agent) => {
    setForm({
      role: agent.role,
      name: agent.name,
      model: agent.model,
      provider: agent.provider,
    });
    setEditingAgent(agent);
    setShowCreate(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          🤖 Agents{" "}
          <span className="text-[var(--text2)] font-normal text-base">
            ({agents.length})
          </span>
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(!showCreate);
          }}
          className="btn bg-[var(--accent)] text-white"
        >
          {showCreate ? "✕ Cancel" : "+ Add Agent"}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="card mb-6 animate-fade-in">
          <h3 className="text-sm font-semibold mb-4">
            {editingAgent ? "Edit Agent" : "Create New Agent"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value;
                  const template = AGENT_TEMPLATES.find(
                    (t) => t.role === role
                  );
                  setForm((f) => ({
                    ...f,
                    role,
                    name: template?.name || f.name,
                  }));
                }}
                className="w-full text-xs"
              >
                {AGENT_TEMPLATES.map((t) => (
                  <option key={t.role} value={t.role}>
                    {t.icon} {t.role} — {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Agent name..."
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">
                Model
              </label>
              <select
                value={form.model}
                onChange={(e) =>
                  setForm((f) => ({ ...f, model: e.target.value }))
                }
                className="w-full text-xs"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">
                Provider
              </label>
              <select
                value={form.provider}
                onChange={(e) =>
                  setForm((f) => ({ ...f, provider: e.target.value }))
                }
                className="w-full text-xs"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingAgent ? updateAgent : createAgent}
              className="btn bg-[var(--green)] text-white"
            >
              {editingAgent ? "Save Changes" : "Create Agent"}
            </button>
            <button onClick={resetForm} className="btn bg-[var(--bg3)] text-[var(--text2)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <div key={agent.id} className="card animate-fade-in">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${agent.color}22` }}
              >
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: `${agent.color}22`,
                      color: agent.color,
                    }}
                  >
                    {agent.role}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text3)] mt-0.5">
                  {agent.model} · {agent.provider}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{agent.score}</div>
                <div className="text-[9px] text-[var(--text3)]">pts</div>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text2)] leading-relaxed mb-2">
              {agent.personality.slice(0, 120)}...
            </p>

            <div className="text-[10px] text-[var(--text3)] mb-3">
              <strong>Specialty:</strong> {agent.specialty.slice(0, 80)}...
            </div>

            {/* Tools */}
            <div className="flex gap-1 flex-wrap mb-3">
              {agent.tools.map((toolId) => (
                <span
                  key={toolId}
                  className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--bg3)] text-[var(--text3)]"
                >
                  {toolId}
                </span>
              ))}
            </div>

            {/* Status & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agent.status === "idle"
                      ? "bg-[var(--green)]"
                      : agent.status === "thinking"
                        ? "bg-[var(--yellow)] animate-pulse"
                        : agent.status === "speaking"
                          ? "bg-[var(--accent)]"
                          : "bg-[var(--text3)]"
                  }`}
                />
                <span className="text-[10px] text-[var(--text2)] capitalize">
                  {agent.status}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(agent)}
                  className="text-[9px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="text-[9px] px-2 py-0.5 rounded border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-[var(--text3)] text-sm">
            No agents configured. Add your first agent to get started.
          </p>
        </div>
      )}
    </div>
  );
}
