import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);
const BASE = "/Users/johndoe";
const AUTOMATION_FILE = `${BASE}/.orchestrator/automation.json`;

const SERVICES = [
  { name: "vr-video-backend", url: "http://localhost:3001/api/health", label: "VR Video API" },
  { name: "hermes-studio", url: "http://localhost:8647/api/health", label: "Hermes Studio" },
  { name: "orchestrator", url: "http://localhost:3000/api/health", label: "Orchestrator" },
  { name: "ollama", url: "http://localhost:11434/api/tags", label: "Ollama" },
  { name: "dash-commander", url: "http://localhost:8091/api/health", label: "DashCommander" },
];

const PROJECT_ROOTS: Record<string, string> = {
  "face/orchestrator-live": "face/orchestrator-live",
  "Desktop/vr video": "Desktop/vr video",
  "hermes-studio": "hermes-studio",
  "Desktop/DashCommanderView": "Desktop/DashCommanderView",
};

async function checkService(svc: { name: string; url: string; label: string }) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(svc.url, { signal: controller.signal });
    clearTimeout(timer);
    // A 401/403 means the service is alive but requires auth — that's "up", not broken.
    if (res.status === 401 || res.status === 403) {
      return { ...svc, status: "ok" as const, detail: "secured (auth required)" };
    }
    if (!res.ok) return { ...svc, status: "error" as const, detail: `HTTP ${res.status}` };
    const json = await res.json().catch(() => ({}));
    // Ollama returns { models: [...] }
    if (svc.name === "ollama") {
      const models: { name: string }[] = json.models || [];
      return { ...svc, status: "ok" as const, detail: `${models.length} models`, models: models.map((m) => m.name) };
    }
    return { ...svc, status: "ok" as const, detail: json.version || "running" };
  } catch {
    return { ...svc, status: "offline" as const, detail: "unreachable" };
  }
}

async function getRecentCommits(repoKey: string, n = 5) {
  const repoPath = path.join(BASE, repoKey);
  try {
    const { stdout } = await execFileAsync("git", [
      "log", "--pretty=format:%H|%an|%ar|%s", "--name-only", "--diff-filter=AM", `-${n}`,
    ], { cwd: repoPath, timeout: 4000 });
    const entries: { hash: string; author: string; ago: string; message: string; repo: string; files: string[] }[] = [];
    for (const block of stdout.trim().split(/\n\n+/)) {
      const lines = block.trim().split("\n").filter(Boolean);
      if (!lines.length) continue;
      const [hash, author, ago, ...msgParts] = lines[0].split("|");
      entries.push({
        hash: hash.slice(0, 7),
        author,
        ago,
        message: msgParts.join("|"),
        repo: repoKey,
        files: lines.slice(1).map((f) => f.trim()).filter(Boolean).slice(0, 4),
      });
    }
    return entries;
  } catch {
    return [];
  }
}

async function getSessionSummaries(limit = 4) {
  const sessionsDir = `${BASE}/.claude/projects/-Users-johndoe`;
  try {
    const files = (await fs.readdir(sessionsDir)).filter((f) => f.endsWith(".jsonl")).sort().reverse().slice(0, limit);
    const out: { session: string; preview: string; size: string }[] = [];
    for (const file of files) {
      try {
        const raw = await fs.readFile(path.join(sessionsDir, file), "utf-8");
        const lines = raw.trim().split("\n").filter(Boolean).slice(-20);
        let preview = "No preview";
        for (const line of [...lines].reverse()) {
          try {
            const m = JSON.parse(line);
            const content = m.message?.content || m.content;
            if (Array.isArray(content)) {
              const txt = content.find((c: { type: string; text?: string }) => c.type === "text")?.text;
              if (txt && txt.length > 30) { preview = txt.slice(0, 140); break; }
            } else if (typeof content === "string" && content.length > 30) {
              preview = content.slice(0, 140); break;
            }
          } catch { /* skip */ }
        }
        const stat = await fs.stat(path.join(sessionsDir, file));
        out.push({ session: file.replace(".jsonl", "").slice(0, 8), preview, size: `${(stat.size / 1024).toFixed(0)}kb` });
      } catch { /* skip */ }
    }
    return out;
  } catch { return []; }
}

async function getAutomationTasks() {
  try {
    const raw = await fs.readFile(AUTOMATION_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// GET /api/brain — full system status for external agents
export async function GET() {
  const [serviceResults, allCommits, sessions, automation] = await Promise.all([
    Promise.all(SERVICES.map(checkService)),
    Promise.all(Object.keys(PROJECT_ROOTS).map((k) => getRecentCommits(PROJECT_ROOTS[k], 3))),
    getSessionSummaries(4),
    getAutomationTasks(),
  ]);

  // Sort commits by recency (they already are, just flatten and take top 10)
  const commits = allCommits.flat().slice(0, 10);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    services: serviceResults,
    recentActivity: { commits, sessions },
    automation,
    _hint: "POST /api/brain/automate to schedule a new task. Services with status 'offline' need to be started. Use the Ollama models list to pick an available model for AI tasks.",
  });
}
