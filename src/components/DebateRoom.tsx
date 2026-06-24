"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Agent, DebateSession, DebateMessage, Idea } from "@/lib/types";

interface Props {
  agents: Agent[];
  sessions: DebateSession[];
  onRefresh: () => Promise<void>;
}

export function DebateRoom({ agents, sessions, onRefresh }: Props) {
  const [topic, setTopic] = useState(
    "How should we design the next generation of AI agent orchestration?"
  );
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<DebateSession | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingAgent, setThinkingAgent] = useState<string | null>(null);
  const [ideaFilter, setIdeaFilter] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select all agents by default
  useEffect(() => {
    if (selectedAgentIds.length === 0 && agents.length > 0) {
      setSelectedAgentIds(agents.slice(0, 4).map((a) => a.id));
    }
  }, [agents, selectedAgentIds.length]);

  const toggleAgent = (id: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Create & Start Debate ──────────────────────────────────
  const startDebate = async () => {
    if (!topic.trim() || selectedAgentIds.length < 2) return;

    try {
      // Create session
      const createRes = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          agentIds: selectedAgentIds,
          maxRounds: 12,
        }),
      });
      const { session } = await createRes.json();
      setActiveSession(session);
      setMessages([]);
      setIdeas([]);

      // Start streaming
      setIsStreaming(true);
      setThinkingAgent(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const streamRes = await fetch(`/api/debates/${session.id}/stream`, {
        method: "POST",
        signal: controller.signal,
      });

      if (!streamRes.body) throw new Error("No response body");

      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const newMessages: DebateMessage[] = [];
      const newIdeas: Idea[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case "status":
                if (data.phase === "completed" || data.phase === "stopped") {
                  setIsStreaming(false);
                  setThinkingAgent(null);
                }
                break;

              case "agent_thinking":
                setThinkingAgent(data.agentId);
                break;

              case "token":
                // Update or append streaming message
                setMessages((prev) => {
                  const existing = prev.find(
                    (m) => m.id === data.messageId
                  );
                  if (existing) {
                    return prev.map((m) =>
                      m.id === data.messageId
                        ? { ...m, text: m.text + data.text }
                        : m
                    );
                  }
                  const newMsg: DebateMessage = {
                    id: data.messageId,
                    agentId: data.agentId,
                    agentName: data.agentName,
                    agentIcon: data.agentIcon,
                    agentColor: data.agentColor,
                    text: data.text,
                    timestamp: new Date().toISOString(),
                    isStreaming: true,
                  };
                  newMessages.push(newMsg);
                  return [...prev, newMsg];
                });
                break;

              case "message_complete":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === data.message.id
                      ? { ...data.message, isStreaming: false }
                      : m
                  )
                );
                if (data.ideas?.length) {
                  setIdeas((prev) => [...prev, ...data.ideas]);
                  newIdeas.push(...data.ideas);
                }
                setThinkingAgent(null);
                break;

              case "error":
                console.error("Stream error:", data.error);
                break;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      setIsStreaming(false);
      setThinkingAgent(null);
      await onRefresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Debate stopped by user");
      } else {
        console.error("Debate error:", err);
      }
      setIsStreaming(false);
      setThinkingAgent(null);
    }
  };

  const stopDebate = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setThinkingAgent(null);
    if (activeSession) {
      fetch(`/api/debates/${activeSession.id}/stop`, { method: "POST" });
    }
  };

  const filteredIdeas =
    ideaFilter === "all" ? ideas : ideas.filter((i) => i.status === ideaFilter);

  const voteIdea = async (ideaId: string, action: string) => {
    await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId, action }),
    });
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== ideaId) return idea;
        if (action === "approve") {
          return { ...idea, status: "approved" as const, votes: idea.votes + 1 };
        }
        if (action === "reject") {
          return { ...idea, status: "rejected" as const };
        }
        if (action === "upvote") {
          return { ...idea, votes: idea.votes + 1 };
        }
        return idea;
      })
    );
  };

  return (
    <div className="h-[calc(100vh-110px)] grid grid-cols-1 lg:grid-cols-[1fr_380px]">
      {/* ═══ LEFT: Debate Chat ═══ */}
      <div className="flex flex-col border-r border-[var(--border)]">
        {/* Topic & Controls */}
        <div className="p-3 border-b border-[var(--border)] space-y-2">
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Debate topic..."
              className="flex-1"
              disabled={isStreaming}
            />
            {!isStreaming ? (
              <button
                onClick={startDebate}
                disabled={!topic.trim() || selectedAgentIds.length < 2}
                className="btn bg-[var(--green)] text-white"
              >
                ▶ Start
              </button>
            ) : (
              <button
                onClick={stopDebate}
                className="btn bg-[var(--red)] text-white"
              >
                ■ Stop
              </button>
            )}
          </div>

          {/* Agent Selector */}
          <div className="flex flex-wrap gap-1.5">
            {agents.map((agent) => {
              const selected = selectedAgentIds.includes(agent.id);
              const isThinking = thinkingAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => !isStreaming && toggleAgent(agent.id)}
                  disabled={isStreaming}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                    isThinking ? "thinking-pulse" : ""
                  }`}
                  style={{
                    background: selected
                      ? `${agent.color}22`
                      : "var(--bg3)",
                    borderColor: selected
                      ? agent.color
                      : isThinking
                        ? "var(--yellow)"
                        : "var(--border)",
                    opacity: isStreaming && !selected ? 0.4 : 1,
                  }}
                >
                  <span>{agent.icon}</span>
                  <span style={{ color: agent.color }}>{agent.name}</span>
                  <span className="text-[var(--green)] font-bold">
                    {agent.score}
                  </span>
                  {isThinking && <span>💭</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-[var(--text3)] py-20">
              <div className="text-4xl mb-4">🏛️</div>
              <p className="text-sm">
                Set a topic, select agents, and press Start.
              </p>
              <p className="text-xs mt-2 text-[var(--text3)]">
                Agents will debate in real-time using AI models.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 animate-fade-in">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${msg.agentColor}22` }}
              >
                {msg.agentIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11px] font-semibold mb-1"
                  style={{ color: msg.agentColor }}
                >
                  {msg.agentName}
                  {msg.isStreaming && (
                    <span className="ml-2 text-[var(--text3)] animate-pulse">
                      ●●●
                    </span>
                  )}
                </div>
                <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ═══ RIGHT: Ideas Sidebar ═══ */}
      <div className="flex flex-col bg-[var(--bg2)]">
        <div className="p-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold mb-2">
            💡 Ideas ({ideas.length})
          </h3>
          <div className="flex gap-1">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setIdeaFilter(f)}
                className={`px-2 py-1 rounded text-[9px] capitalize transition-colors ${
                  ideaFilter === f
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredIdeas.length === 0 && (
            <p className="text-center text-[var(--text3)] text-xs py-8">
              No ideas yet.
            </p>
          )}
          {filteredIdeas.map((idea) => {
            const sc =
              idea.status === "approved"
                ? "var(--green)"
                : idea.status === "rejected"
                  ? "var(--red)"
                  : "var(--yellow)";
            return (
              <div
                key={idea.id}
                className="p-2.5 rounded-lg bg-[var(--bg3)] border border-[var(--border)] border-l-2 animate-slide-in"
                style={{ borderLeftColor: sc }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="badge"
                    style={{ background: `${sc}22`, color: sc }}
                  >
                    {idea.status}
                  </span>
                  <span className="text-[10px] text-[var(--text2)]">
                    {idea.authorName}
                  </span>
                  <span className="text-[10px] text-[var(--text3)] ml-auto">
                    ▲ {idea.votes}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{idea.text}</p>
                {idea.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text3)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {idea.status === "pending" && (
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => voteIdea(idea.id, "approve")}
                      className="text-[9px] px-2 py-0.5 rounded border border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => voteIdea(idea.id, "reject")}
                      className="text-[9px] px-2 py-0.5 rounded border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => voteIdea(idea.id, "upvote")}
                      className="text-[9px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
                    >
                      ▲ Upvote
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
