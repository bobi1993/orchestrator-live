import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { DebateSession, Idea, DebatePhase } from "@/lib/types";

// GET /api/debates — list all debate sessions
// POST /api/debates — create a new debate session

export async function GET() {
  const sessions = store.debates.list();
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, agentIds, maxRounds } = body;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const agents = store.agents.list();
    const selectedAgents =
      agentIds && agentIds.length > 0
        ? agents.filter((a) => agentIds.includes(a.id))
        : agents.slice(0, 4); // default: first 4 agents

    if (selectedAgents.length < 2) {
      return NextResponse.json(
        { error: "At least 2 agents required for a debate" },
        { status: 400 }
      );
    }

    const session: DebateSession = {
      id: `debate_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      topic: topic.trim(),
      phase: "idle",
      agents: selectedAgents.map((a) => a.id),
      messages: [],
      ideas: [],
      toolCalls: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      maxRounds: maxRounds || 10,
      currentRound: 0,
    };

    store.debates.create(session);

    // Update agent statuses
    for (const agent of selectedAgents) {
      store.agents.update(agent.id, { status: "idle" });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create debate" },
      { status: 500 }
    );
  }
}
