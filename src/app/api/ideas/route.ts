import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// GET /api/ideas — list all ideas across all sessions
// PATCH /api/ideas — vote on an idea

export async function GET() {
  const ideas = store.ideas.all();
  return NextResponse.json({ ideas });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ideaId, action } = body;

    if (!ideaId || !action) {
      return NextResponse.json(
        { error: "ideaId and action required" },
        { status: 400 }
      );
    }

    const statusMap: Record<string, "pending" | "approved" | "rejected"> = {
      approve: "approved",
      reject: "rejected",
      reset: "pending",
    };

    const status = statusMap[action];
    if (!status && action !== "upvote") {
      return NextResponse.json(
        { error: "Invalid action. Use: approve, reject, upvote, reset" },
        { status: 400 }
      );
    }

    if (action === "upvote") {
      // Find and increment votes
      for (const session of store.debates.sessions.values()) {
        const idea = session.ideas.find((i) => i.id === ideaId);
        if (idea) {
          idea.votes++;
          return NextResponse.json({ idea });
        }
      }
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const idea = store.ideas.updateStatus(ideaId, status!);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ idea });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update idea" },
      { status: 500 }
    );
  }
}
