"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentPanel } from "@/components/AgentPanel";
import { DebateRoom } from "@/components/DebateRoom";
import { IdeasPanel } from "@/components/IdeasPanel";
import { ToolsPanel } from "@/components/ToolsPanel";
import { OverviewPanel } from "@/components/OverviewPanel";
import { Agent, DebateSession, Idea, ToolDefinition } from "@/lib/types";

type Panel = "overview" | "debate" | "ideas" | "agents" | "tools";

const TABS: { id: Panel; icon: string; label: string }[] = [
  { id: "overview", icon: "🌙", label: "Overview" },
  { id: "debate", icon: "🏛️", label: "Debate Room" },
  { id: "ideas", icon: "💡", label: "Ideas" },
  { id: "agents", icon: "🤖", label: "Agents" },
  { id: "tools", icon: "🔧", label: "Tools" },
];

export default function Dashboard() {
  const [panel, setPanel] = useState<Panel>("overview");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [clock, setClock] = useState("");
  const [loading, setLoading] = useState(true);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Data loading
  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch {
      console.error("Failed to load agents");
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/debates");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      console.error("Failed to load sessions");
    }
  }, []);

  const loadIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch {
      console.error("Failed to load ideas");
    }
  }, []);

  const loadTools = useCallback(async () => {
    try {
      const res = await fetch("/api/tools");
      const data = await res.json();
      setTools(data.tools || []);
    } catch {
      console.error("Failed to load tools");
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        loadAgents(),
        loadSessions(),
        loadIdeas(),
        loadTools(),
      ]);
      setLoading(false);
    })();
  }, [loadAgents, loadSessions, loadIdeas, loadTools]);

  // Refresh data when switching panels
  useEffect(() => {
    if (panel === "agents") loadAgents();
    if (panel === "debate") {
      loadSessions();
      loadAgents();
    }
    if (panel === "ideas") loadIdeas();
    if (panel === "tools") loadTools();
    if (panel === "overview") {
      loadAgents();
      loadSessions();
      loadIdeas();
    }
  }, [panel, loadAgents, loadSessions, loadIdeas, loadTools]);

  // Refresh ideas periodically when on debate panel
  useEffect(() => {
    if (panel !== "debate") return;
    const id = setInterval(loadIdeas, 5000);
    return () => clearInterval(id);
  }, [panel, loadIdeas]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text2)] text-sm">Loading Orchestrator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ═══ */}
      <header className="glass sticky top-0 z-50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] via-[var(--purple)] to-[var(--orange)] flex items-center justify-center text-lg">
            🌙
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Orchestrator</h1>
            <p className="text-[10px] text-[var(--text3)]">
              {agents.length} agents · {ideas.length} ideas · {sessions.length}{" "}
              debates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(63,185,80,0.1)] border border-[rgba(63,185,80,0.2)]">
            <div className="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)]" />
            <span className="text-[10px] text-[var(--green)] font-semibold">
              LIVE
            </span>
          </div>
          <span className="text-sm text-[var(--text2)] tabular-nums">
            {clock}
          </span>
        </div>
      </header>

      {/* ═══ NAV TABS ═══ */}
      <nav className="bg-[var(--bg2)] border-b border-[var(--border)] px-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPanel(t.id)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              panel === t.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text2)] hover:text-[var(--text)]"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* ═══ CONTENT ═══ */}
      <main className="flex-1 overflow-hidden">
        {panel === "overview" && (
          <OverviewPanel
            agents={agents}
            sessions={sessions}
            ideas={ideas}
            onNavigate={setPanel}
          />
        )}
        {panel === "debate" && (
          <DebateRoom
            agents={agents}
            sessions={sessions}
            onRefresh={async () => {
              await loadSessions();
              await loadIdeas();
              await loadAgents();
            }}
          />
        )}
        {panel === "ideas" && (
          <IdeasPanel ideas={ideas} onRefresh={loadIdeas} />
        )}
        {panel === "agents" && (
          <AgentPanel agents={agents} onRefresh={loadAgents} />
        )}
        {panel === "tools" && <ToolsPanel tools={tools} />}
      </main>
    </div>
  );
}
