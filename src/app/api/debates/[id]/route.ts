import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import {
  generateAgentResponse,
  extractIdeas,
} from "@/lib/ai-engine";
import { DebateMessage, Idea } from "@/lib/types";

// GET /api/debates/:id — get session details with messages and ideas
// POST /api/debates/:id/start — start the debate
// POST /api/debates/:id/step — advance one round
// POST /api/debates/:id/stop — stop the debate
// DELETE /api/debates/:id — delete session

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = store.debates.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const toolCalls = store.toolCalls.forSession(id);
  return NextResponse.json({ session, toolCalls });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  const session = store.debates.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (action === "start") {
    store.debates.update(id, { phase: "active" });
    return NextResponse.json({ success: true, phase: "active" });
  }

  if (action === "stop") {
    store.debates.update(id, { phase: "paused" });
    // Reset agent statuses
    for (const agentId of session.agents) {
      store.agents.update(agentId, { status: "idle" });
    }
    return NextResponse.json({ success: true, phase: "paused" });
  }

  if (action === "step") {
    return await executeDebateStep(id, session);
  }

  if (action === "resume") {
    store.debates.update(id, { phase: "active" });
    return NextResponse.json({ success: true, phase: "active" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function executeDebateStep(id: string, session: ReturnType<typeof store.debates.get>) {
  if (!session) return;

  const allAgents = store.agents.list();
  const debateAgents = allAgents.filter((a) => session.agents.includes(a.id));

  if (debateAgents.length === 0) {
    return NextResponse.json({ error: "No agents in this debate" }, { status: 400 });
  }

  // Check round limit
  if (session.currentRound >= session.maxRounds) {
    store.debates.update(id, { phase: "completed" });
    return NextResponse.json({
      done: true,
      reason: "Max rounds reached",
      phase: "completed",
    });
  }

  // Pick the next agent (rotate through agents)
  const agentIdx = session.currentRound % debateAgents.length;
  const agent = debateAgents[agentIdx];

  // Mark agent as thinking
  store.agents.update(agent.id, { status: "thinking" });

  // Generate the message object placeholder
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let fullText = "";

  try {
    fullText = await generateAgentResponse({
      agent,
      topic: session.topic,
      history: session.messages,
      sessionId: id,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    fullText = `[${agent.name} encountered an error: ${errorMsg}. This may be due to missing API keys. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY in your Vercel environment variables.]`;
  }

  const message: DebateMessage = {
    id: msgId,
    agentId: agent.id,
    agentName: agent.name,
    agentIcon: agent.icon,
    agentColor: agent.color,
    text: fullText,
    timestamp: new Date().toISOString(),
  };

  // Extract ideas from the message
  const extractedIdeas = extractIdeas(fullText, agent.id, agent.name);
  const newIdeas: Idea[] = extractedIdeas.map((ei) => ({
    id: ei.id,
    text: ei.text,
    authorId: agent.id,
    authorName: agent.name,
    status: "pending" as const,
    timestamp: new Date().toISOString(),
    votes: 0,
    tags: ei.tags,
  }));

  // Update scores
  const scoreDelta = newIdeas.length > 0 ? newIdeas.length * 2 : 1;
  const updatedAgent = store.agents.update(agent.id, {
    status: "idle",
    score: (agent.score || 0) + scoreDelta,
  });

  // Update session
  const updatedMessages = [...session.messages, message];
  const updatedIdeas = [...session.ideas, ...newIdeas];

  store.debates.update(id, {
    messages: updatedMessages,
    ideas: updatedIdeas,
    currentRound: session.currentRound + 1,
  });

  return NextResponse.json({
    message,
    ideas: newIdeas,
    agent: updatedAgent,
    round: session.currentRound + 1,
    maxRounds: session.maxRounds,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = store.debates.delete(id);
  if (!ok) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
