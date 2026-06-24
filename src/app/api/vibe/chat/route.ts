import { NextRequest } from "next/server";

const DEFAULT_ENDPOINT = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2:latest";

const SYSTEM_PROMPT =
  "You are an expert coding assistant. When asked to modify code, respond with the complete updated file content wrapped in a markdown code block, followed by a brief explanation. Be direct and precise.";

// POST /api/vibe/chat
// body: { request, fileContent, filePath, model? }
// → streams response as text/event-stream (SSE)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, message, fileContent = "", filePath = "", model = DEFAULT_MODEL, endpoint = DEFAULT_ENDPOINT } = body;
    const prompt = request || message;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMessage = `File: ${filePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nRequest: ${prompt}`;
    const ollamaUrl = `${endpoint.replace(/\/$/, "")}/api/chat`;

    const ollamaRes = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      const errText = await ollamaRes.text();
      return new Response(JSON.stringify({ error: `Ollama error: ${errText}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward Ollama NDJSON stream as SSE
    const encoder = new TextEncoder();
    const ollamaReader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await ollamaReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const text = json?.message?.content ?? "";
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
                if (json.done) {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
