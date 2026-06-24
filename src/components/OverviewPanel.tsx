"use client";

import { Agent, DebateSession, Idea, Task } from "@/lib/types";

interface Props {
  agents: Agent[];
  sessions: DebateSession[];
  ideas: Idea[];
  tasks: Task[];
  onNavigate: (panel: "debate" | "ideas" | "agents" | "tasks") => void;
}

export function OverviewPanel({ agents, sessions, ideas, tasks, onNavigate }: Props) {
  const activeSessions = sessions.filter((s) => s.phase === "active").length;
  const approvedIdeas = ideas.filter((i) => i.status === "approved").length;
  const pendingIdeas = ideas.filter((i) => i.status === "pending").length;
  const activeTasks = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Agents", value: agents.length, color: "var(--accent)" },
          { label: "Debates", value: sessions.length, color: "var(--purple)" },
          { label: "Active", value: activeSessions, color: "var(--green)" },
          { label: "Ideas", value: ideas.length, color: "var(--yellow)" },
          { label: "Approved", value: approvedIdeas, color: "var(--green)" },
          { label: "Pending", value: pendingIdeas, color: "var(--orange)" },
          { label: "Tasks", value: activeTasks, color: "var(--cyan)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card text-center py-4"
            style={{ borderColor: `${stat.color}33` }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-[10px] text-[var(--text2)] mt-1 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Agents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--accent)]">
              🤖 Active Agents
            </h3>
            <button
              onClick={() => onNavigate("agents")}
              className="text-[10px] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
            >
              Manage →
            </button>
          </div>
          <div className="space-y-2">
            {agents.slice(0, 6).map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg3)] hover:bg-[var(--border)] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: `${agent.color}22` }}
                >
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: agent.color }}>
                    {agent.name}
                  </div>
                  <div className="text-[10px] text-[var(--text3)]">
                    {agent.role} · {agent.model}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[var(--text)]">
                    {agent.score}
                  </div>
                  <div className="text-[9px] text-[var(--text3)]">pts</div>
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-[var(--text3)] text-xs text-center py-4">
                No agents configured
              </p>
            )}
          </div>
        </div>

        {/* Recent Ideas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--yellow)]">
              💡 Latest Ideas
            </h3>
            <button
              onClick={() => onNavigate("ideas")}
              className="text-[10px] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {ideas.slice(0, 6).map((idea) => {
              const sc =
                idea.status === "approved"
                  ? "var(--green)"
                  : idea.status === "rejected"
                    ? "var(--red)"
                    : "var(--yellow)";
              return (
                <div
                  key={idea.id}
                  className="p-2 rounded-lg bg-[var(--bg3)] border-l-2"
                  style={{ borderLeftColor: sc }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="badge"
                      style={{ background: `${sc}22`, color: sc }}
                    >
                      {idea.status}
                    </span>
                    <span className="text-[10px] text-[var(--text2)]">
                      {idea.authorName}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2">
                    {idea.text}
                  </p>
                </div>
              );
            })}
            {ideas.length === 0 && (
              <p className="text-[var(--text3)] text-xs text-center py-4">
                No ideas yet. Start a debate!
              </p>
            )}
          </div>
        </div>

        {/* Recent Debates */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--purple)]">
              🏛️ Recent Debates
            </h3>
            <button
              onClick={() => onNavigate("debate")}
              className="text-[10px] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
            >
              Open Debate Room →
            </button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-[var(--text3)] text-xs text-center py-8">
              No debate sessions yet. Go to Debate Room to start one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sessions.slice(0, 4).map((s) => {
                const phaseColor =
                  s.phase === "active"
                    ? "var(--green)"
                    : s.phase === "completed"
                      ? "var(--accent)"
                      : s.phase === "paused"
                        ? "var(--yellow)"
                        : "var(--text3)";
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg bg-[var(--bg3)] border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="badge"
                        style={{
                          background: `${phaseColor}22`,
                          color: phaseColor,
                        }}
                      >
                        {s.phase}
                      </span>
                      <span className="text-[10px] text-[var(--text3)]">
                        Round {s.currentRound}/{s.maxRounds}
                      </span>
                    </div>
                    <p className="text-xs font-medium mb-2 line-clamp-2">
                      {s.topic}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text2)]">
                      <span>💬 {s.messages.length} msgs</span>
                      <span>💡 {s.ideas.length} ideas</span>
                      <span>
                        🤖 {s.agents.length} agents
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--cyan)]">
              📋 Active Tasks
            </h3>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-[10px] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {tasks.filter(t => t.status !== "done").slice(0, 4).map(task => {
              const pc = task.priority === "critical" ? "var(--red)" : task.priority === "high" ? "var(--orange)" : task.priority === "normal" ? "var(--accent)" : "var(--text3)";
              return (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg3)]">
                  <div className={`w-2 h-2 rounded-full ${task.status === "in_progress" ? "bg-[var(--yellow)]" : "bg-[var(--text3)]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{task.title}</div>
                    <div className="text-[9px] text-[var(--text3)]">👤 {task.assignee}</div>
                  </div>
                  <span className="badge" style={{ background: `${pc}22`, color: pc }}>{task.priority}</span>
                </div>
              );
            })}
            {tasks.filter(t => t.status !== "done").length === 0 && (
              <p className="text-[var(--text3)] text-xs text-center py-4">No active tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
