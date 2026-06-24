import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const BASE = "/Users/johndoe";
const AUTOMATION_DIR = `${BASE}/.orchestrator`;
const AUTOMATION_FILE = path.join(AUTOMATION_DIR, "automation.json");

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // cron expression or human readable
  command: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  lastRun: string | null;
  lastStatus: "ok" | "error" | "pending" | null;
  tags: string[];
}

async function readTasks(): Promise<AutomationTask[]> {
  try {
    await fs.mkdir(AUTOMATION_DIR, { recursive: true });
    const raw = await fs.readFile(AUTOMATION_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTasks(tasks: AutomationTask[]) {
  await fs.mkdir(AUTOMATION_DIR, { recursive: true });
  await fs.writeFile(AUTOMATION_FILE, JSON.stringify(tasks, null, 2));
}

// GET /api/brain/automate — list all scheduled tasks
export async function GET() {
  const tasks = await readTasks();
  return NextResponse.json({ tasks, count: tasks.length });
}

// POST /api/brain/automate — create a new task
// Body: { name, description, schedule, command, createdBy?, tags? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, schedule, command, createdBy = "agent", tags = [] } = body;

    if (!name || !command) {
      return NextResponse.json({ error: "name and command are required" }, { status: 400 });
    }

    const tasks = await readTasks();
    const newTask: AutomationTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      description: description || "",
      schedule: schedule || "manual",
      command,
      enabled: true,
      createdBy,
      createdAt: new Date().toISOString(),
      lastRun: null,
      lastStatus: null,
      tags,
    };

    tasks.push(newTask);
    await writeTasks(tasks);

    return NextResponse.json({ task: newTask, total: tasks.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/brain/automate?id=task-xxx — remove a task
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tasks = await readTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await writeTasks(filtered);
  return NextResponse.json({ removed: tasks.length - filtered.length });
}

// PATCH /api/brain/automate — update task (toggle enabled, update lastRun)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const tasks = await readTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return NextResponse.json({ error: "task not found" }, { status: 404 });

    tasks[idx] = { ...tasks[idx], ...updates };
    await writeTasks(tasks);
    return NextResponse.json({ task: tasks[idx] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
