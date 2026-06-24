"use client";

import { useState, useEffect } from "react";
import { Agent } from "@/lib/types";

interface Props {
  agents: Agent[];
}

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
}

const SERVICES = [
  { name: "Orchestrator API", port: 3000, status: "running" },
  { name: "OpenClaw Gateway", port: 18788, status: "running" },
  { name: "Odysseus Backend", port: 7000, status: "running" },
  { name: "AI Gateway", port: 3005, status: "stopped" },
  { name: "VR Backend", port: 3001, status: "stopped" },
];

export function SystemPanel({ agents }: Props) {
  const [stats, setStats] = useState<SystemStats>({ cpu: 34, memory: 62, disk: 45 });
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStats({
        cpu: Math.max(10, Math.min(90, stats.cpu + (Math.random() - 0.5) * 8)),
        memory: Math.max(30, Math.min(85, stats.memory + (Math.random() - 0.5) * 3)),
        disk: stats.disk,
      });
      setUptime(u => u + 1);
    }, 3000);
    return () => clearInterval(id);
  }, [stats.cpu, stats.memory, stats.disk]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const activeAgents = agents.filter(a => a.status !== "offline").length;

  const resourceBars = [
    { label: "CPU", value: stats.cpu, color: stats.cpu > 80 ? "var(--red)" : "var(--green)" },
    { label: "Memory", value: stats.memory, color: stats.memory > 80 ? "var(--red)" : "var(--accent)" },
    { label: "Disk", value: stats.disk, color: stats.disk > 80 ? "var(--red)" : "var(--yellow)" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">⚙️ System</h2>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-[var(--accent)]">{activeAgents}</div>
          <div className="text-[10px] text-[var(--text2)] mt-1 uppercase tracking-wider">Active Agents</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-[var(--green)]">{SERVICES.filter(s => s.status === "running").length}</div>
          <div className="text-[10px] text-[var(--text2)] mt-1 uppercase tracking-wider">Services Up</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-[var(--purple)]">{formatUptime(uptime)}</div>
          <div className="text-[10px] text-[var(--text2)] mt-1 uppercase tracking-wider">Uptime</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--accent)] mb-4">📊 Resources</h3>
          <div className="space-y-4">
            {resourceBars.map(stat => (
              <div key={stat.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--text2)]">{stat.label}</span>
                  <span className="font-semibold" style={{ color: stat.color }}>{stat.value.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.value}%`, background: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--green)] mb-4">🔌 Services</h3>
          <div className="space-y-2">
            {SERVICES.map(s => (
              <div key={s.name} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg3)]">
                <div className={`w-2 h-2 rounded-full ${s.status === "running" ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} />
                <span className="text-[11px] flex-1">{s.name}</span>
                <span className="text-[9px] text-[var(--text3)]">:{s.port}</span>
                <span
                  className="badge"
                  style={{
                    background: s.status === "running" ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)",
                    color: s.status === "running" ? "var(--green)" : "var(--red)",
                  }}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--purple)] mb-4">🤖 Agent Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {agents.map(agent => (
              <div key={agent.id} className="p-3 rounded-lg bg-[var(--bg3)] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `${agent.color}22` }}>
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate" style={{ color: agent.color }}>{agent.name}</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      agent.status === "idle" ? "bg-[var(--green)]" :
                      agent.status === "thinking" ? "bg-[var(--yellow)] animate-pulse" :
                      agent.status === "speaking" ? "bg-[var(--accent)]" :
                      "bg-[var(--text3)]"
                    }`} />
                    <span className="text-[9px] text-[var(--text3)] capitalize">{agent.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
