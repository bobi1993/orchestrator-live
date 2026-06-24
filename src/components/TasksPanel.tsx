"use client";

import { useState } from "react";
import { Task, Agent, TaskStatus, TaskPriority } from "@/lib/types";

interface Props {
  tasks: Task[];
  agents: Agent[];
  onRefresh: () => Promise<void>;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  todo: { label: "To Do", color: "var(--text2)", dot: "var(--text3)" },
  in_progress: { label: "In Progress", color: "var(--yellow)", dot: "var(--yellow)" },
  done: { label: "Done", color: "var(--green)", dot: "var(--green)" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "var(--text3)" },
  normal: { label: "Normal", color: "var(--accent)" },
  high: { label: "High", color: "var(--orange)" },
  critical: { label: "Critical", color: "var(--red)" },
};

export function TasksPanel({ tasks, agents, onRefresh }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "normal" as TaskPriority, assignee: "" });
  const [filter, setFilter] = useState<string>("all");

  const createTask = async () => {
    if (!form.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", priority: "normal", assignee: "" });
    setShowCreate(false);
    await onRefresh();
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await onRefresh();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, _delete: true }),
    });
    await onRefresh();
  };

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const doneCount = tasks.filter(t => t.status === "done").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            📋 Tasks <span className="text-[var(--text2)] font-normal text-base">({tasks.length})</span>
          </h2>
          <div className="flex gap-4 mt-1 text-[10px] text-[var(--text3)]">
            <span>{todoCount} to do</span>
            <span>{inProgressCount} in progress</span>
            <span>{doneCount} done</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {["all", "todo", "in_progress", "done"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] capitalize transition-colors ${
                  filter === f ? "bg-[var(--accent)] text-white" : "bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)]"
                }`}
              >
                {f === "in_progress" ? "Active" : f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn bg-[var(--green)] text-white">
            {showCreate ? "✕ Cancel" : "+ New Task"}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card mb-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title..." className="w-full text-xs" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." className="w-full text-xs h-16 resize-none" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))} className="w-full text-xs">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text2)] uppercase tracking-wider mb-1 block">Assignee</label>
              <select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="w-full text-xs">
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a.id} value={a.name}>{a.icon} {a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={createTask} className="btn bg-[var(--green)] text-white">Create Task</button>
            <button onClick={() => setShowCreate(false)} className="btn bg-[var(--bg3)] text-[var(--text2)]">Cancel</button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-[var(--text3)] text-sm py-16">
            <div className="text-3xl mb-3">📋</div>
            No tasks match this filter.
          </div>
        )}
        {filtered.map(task => {
          const sc = STATUS_CONFIG[task.status];
          const pc = PRIORITY_CONFIG[task.priority];
          return (
            <div key={task.id} className="card flex items-center gap-4 animate-fade-in">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${task.status === "done" ? "line-through text-[var(--text3)]" : ""}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-[10px] text-[var(--text3)] mt-0.5 line-clamp-1">{task.description}</div>
                )}
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text3)]">
                  <span>👤 {task.assignee}</span>
                  <span className="badge" style={{ background: `${pc.color}22`, color: pc.color }}>{pc.label}</span>
                  <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.status !== "done" && task.status !== "in_progress" && (
                  <button onClick={() => updateStatus(task.id, "in_progress")} className="text-[9px] px-2 py-1 rounded border border-[var(--yellow)] text-[var(--yellow)] hover:bg-[var(--yellow)] hover:text-white transition-colors">
                    Start
                  </button>
                )}
                {task.status === "in_progress" && (
                  <button onClick={() => updateStatus(task.id, "done")} className="text-[9px] px-2 py-1 rounded border border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white transition-colors">
                    Complete
                  </button>
                )}
                {task.status === "done" && (
                  <button onClick={() => updateStatus(task.id, "todo")} className="text-[9px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text2)] hover:text-[var(--accent)] transition-colors">
                    Reopen
                  </button>
                )}
                <button onClick={() => deleteTask(task.id)} className="text-[9px] px-2 py-1 rounded border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
