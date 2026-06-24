import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { generateAgentResponse, extractIdeas } from "@/lib/ai-engine";
import { DebateMessage, Idea } from "@/lib/types";

// POST /api/debates/:id/stream
// Server-Sent Events endpoint for real-time debate streaming
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = store.debates.get(id);

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const allAgents = store.agents.list();
        const debateAgents = allAgents.filter((a) =>
          session.agents.includes(a.id)
        );

        if (debateAgents.length === 0) {
          send({ error: "No agents in this debate" });
          controller.close();
          return;
        }

        // Start the debate
        store.debates.update(id, { phase: "active" });
        send({ type: "status", phase: "active" });

        const maxRounds = session.maxRounds;

        for (
          let round = session.currentRound;
          round < maxRounds;
          round++
        ) {
          const agentIdx = round % debateAgents.length;
          const agent = debateAgents[agentIdx];

          // Check if debate was stopped
          const currentSession = store.debates.get(id);
          if (!currentSession || currentSession.phase !== "active") {
            send({ type: "status", phase: "stopped" });
            break;
          }

          store.agents.update(agent.id, { status: "thinking" });
          send({
            type: "agent_thinking",
            agentId: agent.id,
            agentName: agent.name,
          });

          const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          let fullText = "";

          try {
            fullText = await generateAgentResponse({
              agent,
              topic: session.topic,
              history: store.debates.get(id)?.messages || [],
              sessionId: id,
              onChunk: (chunk) => {
                send({
                  type: "token",
                  agentId: agent.id,
                  agentName: agent.name,
                  agentIcon: agent.icon,
                  agentColor: agent.color,
                  text: chunk,
                  messageId: msgId,
                });
              },
            });
          } catch (err: unknown) {
            const errorMsg =
              err instanceof Error ? err.message : "Unknown error";
            fullText = `[Error: ${errorMsg}]`;
            send({
              type: "error",
              agentId: agent.id,
              error: errorMsg,
            });
          }

          // Save the complete message
          const message: DebateMessage = {
            id: msgId,
            agentId: agent.id,
            agentName: agent.name,
            agentIcon: agent.icon,
            agentColor: agent.color,
            text: fullText,
            timestamp: new Date().toISOString(),
          };

          // Extract ideas
          const extractedIdeas = extractIdeas(
            fullText,
            agent.id,
            agent.name
          );
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

          // Update agent
          const scoreDelta = newIdeas.length > 0 ? newIdeas.length * 2 : 1;
          store.agents.update(agent.id, {
            status: "idle",
            score: (agent.score || 0) + scoreDelta,
          });

          // Update session
          const currentMsgs = store.debates.get(id)?.messages || [];
          const currentIdeas = store.debates.get(id)?.ideas || [];
          store.debates.update(id, {
            messages: [...currentMsgs, message],
            ideas: [...currentIdeas, ...newIdeas],
            currentRound: round + 1,
          });

          // Send complete message event
          send({
            type: "message_complete",
            message,
            ideas: newIdeas,
            round: round + 1,
            maxRounds,
          });

          // Small delay between agents
          await new Promise((r) => setTimeout(r, 500));
        }

        // Mark debate as completed
        store.debates.update(id, { phase: "completed" });
        send({ type: "status", phase: "completed" });
      } catch (err: unknown) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Stream error",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
