import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Agent } from "@/lib/types";
import { createAgentFromTemplate, AGENT_TEMPLATES } from "@/lib/agents";

// GET /api/agents — list all agents
// POST /api/agents — create a new agent
export async function GET() {
  const agents = store.agents.list();
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, name, model, provider, personality, specialty, tools } = body;

    // Find template for the role
    const template = AGENT_TEMPLATES.find((t) => t.role === role);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown role: ${role}. Available: ${AGENT_TEMPLATES.map((t) => t.role).join(", ")}` },
        { status: 400 }
      );
    }

    const agent = createAgentFromTemplate(template, {
      name,
      model,
      provider,
      personality,
      specialty,
      tools,
    });

    store.agents.create(agent);
    return NextResponse.json({ agent }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create agent" },
      { status: 500 }
    );
  }
}
