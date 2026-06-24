import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);
const BASE = "/Users/johndoe";

const PROJECT_ROOTS: Record<string, string> = {
  "Desktop/DashCommanderView/frontend": "Desktop/DashCommanderView",
  "Desktop/vr video/frontend/src": "Desktop/vr video",
  "Desktop/vr video/backend": "Desktop/vr video",
  "hermes-studio/packages/client/src": "hermes-studio",
  "face/orchestrator-live/src": "face/orchestrator-live",
};

async function getGitLog(repoPath: string) {
  try {
    const { stdout } = await execFileAsync("git", [
      "log", "--pretty=format:%H|%an|%ar|%s", "--name-only", "--diff-filter=AM", "-15",
    ], { cwd: repoPath, timeout: 5000 });

    const entries: { hash: string; author: string; ago: string; message: string; files: string[] }[] = [];
    const blocks = stdout.trim().split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.trim().split("\n").filter(Boolean);
      if (!lines.length) continue;
      const [hash, author, ago, ...msgParts] = lines[0].split("|");
      const message = msgParts.join("|");
      const files = lines.slice(1).map((f) => f.trim()).filter(Boolean).slice(0, 6);
      entries.push({ hash: hash.slice(0, 7), author, ago, message, files });
    }
    return entries;
  } catch {
    return [];
  }
}

async function getSessionSummaries() {
  const sessionsDir = `${BASE}/.claude/projects/-Users-johndoe`;
  try {
    const files = await fs.readdir(sessionsDir);
    const jsonlFiles = files.filter((f) => f.endsWith(".jsonl")).sort().reverse().slice(0, 6);

    const summaries: { session: string; preview: string; size: string }[] = [];
    for (const file of jsonlFiles) {
      try {
        const raw = await fs.readFile(path.join(sessionsDir, file), "utf-8");
        const lines = raw.trim().split("\n").filter(Boolean);
        const msgs: { role?: string; content?: string | { type: string; text?: string }[] }[] = [];
        for (const line of lines.slice(-30)) {
          try { msgs.push(JSON.parse(line)); } catch { /* skip */ }
        }
        const lastAssistant = [...msgs].reverse().find(
          (m) => m.role === "assistant" && typeof m.content === "string" && m.content.length > 20
        );
        const preview = lastAssistant
          ? (typeof lastAssistant.content === "string" ? lastAssistant.content.slice(0, 120) : "")
          : "No preview available";
        const stat = await fs.stat(path.join(sessionsDir, file));
        const kb = (stat.size / 1024).toFixed(0);
        summaries.push({ session: file.replace(".jsonl", "").slice(0, 8), preview, size: `${kb}kb` });
      } catch {
        /* skip */
      }
    }
    return summaries;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || "";

  const repoRelative = PROJECT_ROOTS[project] || project;
  const repoPath = path.join(BASE, repoRelative);

  const [commits, sessions] = await Promise.all([getGitLog(repoPath), getSessionSummaries()]);

  return NextResponse.json({ commits, sessions });
}
