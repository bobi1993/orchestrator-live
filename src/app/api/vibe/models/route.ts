import { NextRequest, NextResponse } from "next/server";

// GET /api/vibe/models?endpoint=http://localhost:11434
// Returns available models from the Ollama instance at the given endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") || "http://localhost:11434";

  try {
    const res = await fetch(`${endpoint}/api/tags`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Ollama responded ${res.status}`, models: [] }, { status: 200 });
    }

    const data = await res.json();
    const models = (data.models || []).map((m: { name: string; size?: number; details?: { parameter_size?: string } }) => ({
      id: m.name,
      label: m.name,
      size: m.details?.parameter_size || null,
    }));

    return NextResponse.json({ models, endpoint });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reach Ollama";
    return NextResponse.json({ error: message, models: [] }, { status: 200 });
  }
}
