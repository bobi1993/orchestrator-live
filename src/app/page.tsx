"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentPanel } from "@/components/AgentPanel";
import { DebateRoom } from "@/components/DebateRoom";
import { IdeasPanel } from "@/components/IdeasPanel";
import { ToolsPanel } from "@/components/ToolsPanel";
import { OverviewPanel } from "@/components/OverviewPanel";
import { AgentNodeCanvas } from "@/components/AgentNodeCanvas";
import { TasksPanel } from "@/components/TasksPanel";
import { ModelsPanel } from "@/components/ModelsPanel";
import { SystemPanel } from "@/components/SystemPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { NotificationCenter } from "@/components/NotificationCenter";
import { VibeCodePanel } from "@/components/VibeCodePanel";
import { Agent, DebateSession, Idea, ToolDefinition, Task, LLMModel, Notification } from "@/lib/types";

type Panel = "overview" | "debate" | "ideas" | "agents" | "nodes" | "tasks" | "models" | "tools" | "system" | "settings" | "vibe";

const TABS: { id: Panel; icon: string; label: string }[] = [
  { id: "vibe", icon: "⚡", label: "Vibe Code" },
  { id: "overview", icon: "🌙", label: "Overview" },
  { id: "debate", icon: "🏛️", label: "Debate Room" },
  { id: "ideas", icon: "💡", label: "Ideas" },
  { id: "agents", icon: "🤖", label: "Agents" },
  { id: "nodes", icon: "🕸️", label: "Node Graph" },
  { id: "tasks", icon: "📋", label: "Tasks" },
  { id: "models", icon: "🧬", label: "Models" },
  { id: "tools", icon: "🔧", label: "Tools" },
  { id: "system", icon: "⚙️", label: "System" },
  { id: "settings", icon: "🎨", label: "Settings" },
];

export default function Dashboard() {
  const [panel, setPanel] = useState<Panel>("overview");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clock, setClock] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Data loaders
  const loadAgents = useCallback(async () => {
    try { const r = await fetch("/api/agents"); const d = await r.json(); setAgents(d.agents || []); } catch { /* */ }
  }, []);
  const loadSessions = useCallback(async () => {
    try { const r = await fetch("/api/debates"); const d = await r.json(); setSessions(d.sessions || []); } catch { /* */ }
  }, []);
  const loadIdeas = useCallback(async () => {
    try { const r = await fetch("/api/ideas"); const d = await r.json(); setIdeas(d.ideas || []); } catch { /* */ }
  }, []);
  const loadTasks = useCallback(async () => {
    try { const r = await fetch("/api/tasks"); const d = await r.json(); setTasks(d.tasks || []); } catch { /* */ }
  }, []);
  const loadModels = useCallback(async () => {
    try { const r = await fetch("/api/models"); const d = await r.json(); setModels(d.models || []); } catch { /* */ }
  }, []);
  const loadTools = useCallback(async () => {
    try { const r = await fetch("/api/tools"); const d = await r.json(); setTools(d.tools || []); } catch { /* */ }
  }, []);
  const loadNotifications = useCallback(async () => {
    try { const r = await fetch("/api/notifications"); const d = await r.json(); setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); } catch { /* */ }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadAgents(), loadSessions(), loadIdeas(), loadTasks(), loadModels(), loadTools(), loadNotifications()]);
      setLoading(false);
    })();
  }, [loadAgents, loadSessions, loadIdeas, loadTasks, loadModels, loadTools, loadNotifications]);

  // Refresh on panel switch
  useEffect(() => {
    if (panel === "agents" || panel === "nodes") loadAgents();
    if (panel === "debate") { loadSessions(); loadAgents(); }
    if (panel === "ideas") loadIdeas();
    if (panel === "tasks") loadTasks();
    if (panel === "models") loadModels();
    if (panel === "tools") loadTools();
    if (panel === "system") { loadAgents(); loadNotifications(); }
    if (panel === "overview") { loadAgents(); loadSessions(); loadIdeas(); loadTasks(); loadNotifications(); }
  }, [panel, loadAgents, loadSessions, loadIdeas, loadTasks, loadModels, loadTools, loadNotifications]);

  // Periodic refresh for active debate
  useEffect(() => {
    if (panel !== "debate") return;
    const id = setInterval(() => { loadIdeas(); loadAgents(); }, 5000);
    return () => clearInterval(id);
  }, [panel, loadIdeas, loadAgents]);

  // DashCommanderView shell deep-link: listen for SWITCH_PANEL postMessages
  useEffect(() => {
    const VALID_PANELS: Panel[] = ["overview", "debate", "ideas", "agents", "nodes", "tasks", "models", "tools", "system", "settings", "vibe"];
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "SWITCH_PANEL" && VALID_PANELS.includes(e.data.panel)) {
        setPanel(e.data.panel);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markAllRead" }) });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
              {agents.length} agents · {ideas.length} ideas · {tasks.filter(t => t.status !== "done").length} active tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative bg-transparent border-none text-[var(--text2)] text-lg cursor-pointer p-1.5 rounded-md hover:bg-[var(--bg3)] transition-colors"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[var(--red)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={markAllRead}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(63,185,80,0.1)] border border-[rgba(63,185,80,0.2)]">
            <div className="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)]" />
            <span className="text-[10px] text-[var(--green)] font-semibold">LIVE</span>
          </div>
          <span className="text-sm text-[var(--text2)] tabular-nums">{clock}</span>
        </div>
      </header>

      {/* ═══ NAV TABS ═══ */}
      <nav className="bg-[var(--bg2)] border-b border-[var(--border)] px-4 flex gap-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPanel(t.id)}
            className={`px-3 py-3 text-[11px] font-medium border-b-2 transition-all whitespace-nowrap ${
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
          <OverviewPanel agents={agents} sessions={sessions} ideas={ideas} tasks={tasks} onNavigate={setPanel} />
        )}
        {panel === "debate" && (
          <DebateRoom agents={agents} sessions={sessions} onRefresh={async () => { await loadSessions(); await loadIdeas(); await loadAgents(); }} />
        )}
        {panel === "ideas" && <IdeasPanel ideas={ideas} onRefresh={loadIdeas} />}
        {panel === "agents" && <AgentPanel agents={agents} onRefresh={loadAgents} />}
        {panel === "nodes" && <AgentNodeCanvas agents={agents} onRefresh={loadAgents} />}
        {panel === "tasks" && <TasksPanel tasks={tasks} agents={agents} onRefresh={loadTasks} />}
        {panel === "models" && <ModelsPanel models={models} />}
        {panel === "tools" && <ToolsPanel tools={tools} />}
        {panel === "system" && <SystemPanel agents={agents} />}
        {panel === "settings" && <SettingsPanel />}
        {panel === "vibe" && <VibeCodePanel />}
      </main>
    </div>
  );
}
