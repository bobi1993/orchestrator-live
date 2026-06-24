import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Task, TaskStatus, TaskPriority } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ tasks: store.tasks.list() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, priority, assignee } = body;
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      description: description || "",
      status: "todo",
      priority: (priority as TaskPriority) || "normal",
      assignee: assignee || "Unassigned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.tasks.create(task);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, _delete, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (_delete) {
      const ok = store.tasks.remove(id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    }
    const task = store.tasks.update(id, updates);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
