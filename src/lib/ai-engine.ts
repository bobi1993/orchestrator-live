// ═══════════════════════════════════════════════════════════════
// AI Model Provider Configuration
// Uses Vercel AI SDK with OpenRouter for multi-model support
// ═══════════════════════════════════════════════════════════════

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, tool, Tool, ModelMessage, asSchema } from "ai";
import { z } from "zod";
import { Agent, DebateMessage, ToolCall } from "./types";
import { getToolById, TOOL_REGISTRY } from "./tools";
import { store } from "./store";

// ─── Provider Factory ───────────────────────────────────────────

export function getProviderModel(agent: Agent) {
  // OpenRouter path (supports all models through one API)
  if (
    agent.provider === "openrouter" ||
    agent.model.includes("/")
  ) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Orchestrator Dashboard",
      },
    });
    return openrouter(agent.model);
  }

  // Direct Anthropic
  if (agent.provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(agent.model);
  }

  // Default: OpenAI-compatible
  const provider = createOpenAI({
    baseURL:
      process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey:
      process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  });
  return provider(agent.model);
}

// ─── Tool Execution ─────────────────────────────────────────────

async function executeTool(
  toolId: string,
  args: Record<string, unknown>,
  sessionId: string
): Promise<string> {
  const toolDef = getToolById(toolId);
  if (!toolDef) return `Error: Unknown tool "${toolId}"`;

  const call: ToolCall = {
    id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    toolName: toolDef.name,
    args,
    status: "running",
    startedAt: new Date().toISOString(),
  };
  store.toolCalls.add(sessionId, call);

  try {
    let result: string;

    switch (toolId) {
      case "web_search": {
        const query = String(args.query || "");
        const maxResults = Number(args.maxResults || 5);
        // Use a simple search via fetch to DuckDuckGo or similar
        // In production, integrate with SerpAPI, Brave Search, etc.
        result = await performWebSearch(query, maxResults);
        break;
      }
      case "web_fetch": {
        const url = String(args.url || "");
        result = await performWebFetch(url);
        break;
      }
      case "code_exec": {
        const code = String(args.code || "");
        const lang = String(args.language || "python");
        result = await performCodeExec(code, lang);
        break;
      }
      case "file_read":
      case "file_write":
      case "file_list": {
        result = `[File operations are simulated in this environment]\nTool: ${toolDef.name}\nArgs: ${JSON.stringify(args, null, 2)}`;
        break;
      }
      case "docx_gen":
      case "xlsx_gen":
      case "pptx_gen":
      case "pdf_gen": {
        result = `[Document generation simulated]\nTool: ${toolDef.name}\nArgs: ${JSON.stringify(args, null, 2)}`;
        break;
      }
      case "image_gen": {
        result = `[Image generation simulated]\nPrompt: ${args.prompt}\nStyle: ${args.style || "default"}`;
        break;
      }
      case "data_query": {
        result = performDataQuery(String(args.query || ""));
        break;
      }
      default:
        result = `Tool "${toolDef.name}" executed with args: ${JSON.stringify(args)}`;
    }

    store.toolCalls.update(sessionId, call.id, {
      status: "complete",
      result,
      completedAt: new Date().toISOString(),
    });
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    store.toolCalls.update(sessionId, call.id, {
      status: "error",
      error: errorMsg,
      completedAt: new Date().toISOString(),
    });
    return `Error executing ${toolDef.name}: ${errorMsg}`;
  }
}

// ─── Simulated Tool Implementations ─────────────────────────────

async function performWebSearch(
  query: string,
  maxResults: number
): Promise<string> {
  // In production, replace with real search API (SerpAPI, Brave, Perplexity, etc.)
  // For now, return a structured placeholder that the agent can reference
  return `Web search results for "${query}" (top ${maxResults} results simulated):\n\n1. [Result 1] Recent developments in ${query} — example.com\n2. [Result 2] Analysis of ${query} from multiple perspectives — research.org\n3. [Result 3] ${query}: A comprehensive overview — docs.io\n\nNote: Connect a real search API (SerpAPI, Brave Search, Perplexity) for live results. Set SEARCH_API_KEY in env.`;
}

async function performWebFetch(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "OrchestratorBot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `HTTP ${res.status}: Failed to fetch ${url}`;
    const text = await res.text();
    // Strip HTML tags for readability
    const stripped = text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    return `Content from ${url}:\n\n${stripped}`;
  } catch (err: unknown) {
    return `Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function performCodeExec(
  code: string,
  language: string
): Promise<string> {
  // In production, use a sandboxed execution environment
  // (Vercel Sandbox, E2B, Daytona, etc.)
  return `[Code execution simulated — ${language}]\n\n\`\`\`${language}\n${code.slice(0, 500)}\n\`\`\`\n\nResult: Code would execute in sandboxed environment.\nSet up Vercel Sandbox or E2B for real execution.`;
}

function performDataQuery(query: string): string {
  const agents = store.agents.list();
  const debates = store.debates.list();
  const ideas = store.ideas.all();

  const q = query.toLowerCase();
  if (q.includes("agent") && (q.includes("count") || q.includes("how many"))) {
    return `Total agents: ${agents.length}\n\n${agents.map((a) => `- ${a.name} (${a.role}): score ${a.score}`).join("\n")}`;
  }
  if (q.includes("idea")) {
    return `Total ideas: ${ideas.length}\n\n${ideas.map((i) => `- "${i.text.slice(0, 60)}..." [${i.status}] by ${i.authorName}`).join("\n")}`;
  }
  if (q.includes("debate") || q.includes("session")) {
    return `Active debate sessions: ${debates.length}\n\n${debates.map((d) => `- "${d.topic.slice(0, 50)}" [${d.phase}] ${d.messages.length} messages`).join("\n")}`;
  }
  return `Data query: "${query}"\n\nAvailable data:\n- Agents: ${agents.length}\n- Debate sessions: ${debates.length}\n- Ideas: ${ideas.length}\n\nTry: "how many agents", "list ideas", "debate sessions"`;
}

// ─── Build AI Tools for an Agent ────────────────────────────────

function buildAgentTools(agent: Agent, sessionId: string): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

  for (const toolId of agent.tools) {
    const toolDef = getToolById(toolId);
    if (!toolDef) continue;

    // Build Zod schema from tool parameters
    const schemaObj: Record<string, z.ZodType> = {};
    for (const param of toolDef.parameters) {
      let zodType: z.ZodType =
        param.type === "string"
          ? z.string()
          : param.type === "number"
            ? z.number()
            : param.type === "boolean"
              ? z.boolean()
              : z.array(z.string());

      if (!param.required) zodType = zodType.optional();
      if (param.description) zodType = zodType.describe(param.description);

      schemaObj[param.name] = zodType;
    }

    tools[toolId] = tool({
      description: toolDef.description,
      inputSchema: asSchema(z.object(schemaObj)),
      execute: async (args: Record<string, unknown>) => executeTool(toolId, args, sessionId),
    }) as unknown as Tool;
  }

  return tools;
}

// ─── System Prompt Builder ──────────────────────────────────────

function buildSystemPrompt(
  agent: Agent,
  topic: string,
  history: DebateMessage[]
): string {
  const recentHistory = history
    .slice(-8)
    .map((m) => `${m.agentName}: ${m.text}`)
    .join("\n");

  const toolsList = agent.tools
    .map((id) => {
      const t = getToolById(id);
      return t ? `- ${t.name} (${id}): ${t.description}` : "";
    })
    .filter(Boolean)
    .join("\n");

  return `You are ${agent.name}, a ${agent.role} in a multi-agent debate.

Your personality: ${agent.personality}
Your specialty: ${agent.specialty}

DEBATE TOPIC: ${topic}

${recentHistory ? `RECENT DISCUSSION:\n${recentHistory}\n` : ""}

AVAILABLE TOOLS:
${toolsList}

RULES:
1. Keep responses focused and under 200 words per turn.
2. Build on previous points — reference specific ideas from other agents.
3. Use tools when you need data, facts, or to produce artifacts.
4. Never repeat what you've already said.
5. If you have a concrete proposal, state it clearly.
6. Challenge ideas, not people.
7. End with a clear position or question to advance the debate.

Respond as ${agent.name} (${agent.role}). Be concise, substantive, and advance the discussion.`;
}

// ─── Generate Agent Response (Streaming) ────────────────────────

export async function generateAgentResponse(params: {
  agent: Agent;
  topic: string;
  history: DebateMessage[];
  sessionId: string;
  onChunk?: (text: string) => void;
}): Promise<string> {
  const { agent, topic, history, sessionId, onChunk } = params;

  const model = getProviderModel(agent);
  const tools = buildAgentTools(agent, sessionId);
  const systemPrompt = buildSystemPrompt(agent, topic, history);

  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of history.slice(-12)) {
    messages.push({
      role: msg.agentId === agent.id ? "assistant" : "user",
      content: `${msg.agentName}: ${msg.text}`,
    });
  }

  // Add the trigger for this turn
  messages.push({
    role: "user",
    content: `It's your turn, ${agent.name}. Respond to the debate on "${topic}". ${history.length > 0 ? "Build on the last point made." : "Open the discussion."}`,
  });

  if (onChunk) {
    // Streaming mode
    const result = streamText({
      model,
      messages,
      tools,
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
      onChunk(chunk);
    }

    // Check for tool calls in the result
    const toolResults = await result.toolResults;
    if (toolResults && toolResults.length > 0) {
      for (const tr of toolResults) {
        fullText += `\n\n[Used ${tr.toolName}]`;
      }
    }

    return fullText;
  } else {
    // Non-streaming mode
    const result = await generateText({
      model,
      messages,
      tools,
      maxOutputTokens: 1024,
      temperature: 0.7,
    });
    return result.text;
  }
}

// ─── Extract Ideas from Text ────────────────────────────────────

export function extractIdeas(
  text: string,
  agentId: string,
  agentName: string
): { id: string; text: string; tags: string[] }[] {
  const ideas: { id: string; text: string; tags: string[] }[] = [];

  // Pattern: "I propose/suggest/recommend that..."
  const proposalPatterns = [
    /(?:I propose|I suggest|I recommend|we should|we need to|we could|let's|my proposal is|the key idea is|the solution is|I believe we should)\s+(.{15,300}?)(?:\.|$)/gi,
    /(?:what if we|consider|imagine if|the breakthrough would be)\s+(.{15,300}?)(?:\.|$)/gi,
  ];

  for (const pattern of proposalPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const ideaText = match[1].trim().replace(/[.!?,;]+$/, "");
      if (ideaText.length > 15) {
        const tags = extractTags(ideaText);
        ideas.push({
          id: `idea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: ideaText,
          tags,
        });
      }
    }
  }

  return ideas;
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const tagMap: Record<string, string[]> = {
    architecture: ["architecture", "system", "design", "structure", "pattern"],
    performance: ["performance", "speed", "latency", "throughput", "fast", "slow"],
    security: ["security", "auth", "encrypt", "safe", "vulnerability", "trust"],
    scalability: ["scale", "distributed", "cluster", "horizontal", "sharding"],
    ux: ["user", "experience", "interface", "usability", "intuitive"],
    ai: ["ai", "model", "llm", "agent", "neural", "machine learning"],
    data: ["data", "database", "storage", "query", "cache", "persist"],
    testing: ["test", "quality", "bug", "debug", "verify", "validate"],
    deployment: ["deploy", "ci/cd", "pipeline", "release", "ship", "production"],
    cost: ["cost", "budget", "price", "expensive", "cheap", "efficient"],
  };

  const lower = text.toLowerCase();
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 3);
}
