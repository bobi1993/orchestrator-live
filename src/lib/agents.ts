// ═══════════════════════════════════════════════════════════════
// Agent Templates & Default Agent Definitions
// ═══════════════════════════════════════════════════════════════

import { Agent, AgentRole } from "./types";

export interface AgentTemplate {
  role: AgentRole;
  name: string;
  icon: string;
  color: string;
  personality: string;
  specialty: string;
  defaultModel: string;
  defaultProvider: string;
  tools: string[];
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    role: "Researcher",
    name: "Atlas",
    icon: "🔬",
    color: "#58a6ff",
    personality:
      "Methodical and evidence-driven. Always cites sources, never speculates without data. Asks clarifying questions before diving in.",
    specialty:
      "Finds and synthesizes information from multiple sources. Excels at providing factual grounding for debates.",
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    defaultProvider: "openrouter",
    tools: ["web_search", "web_fetch", "file_read", "data_query"],
  },
  {
    role: "Critic",
    name: "Socrates",
    icon: "⚖️",
    color: "#f85149",
    personality:
      "Sharp, probing, and fair. Challenges assumptions and identifies logical fallacies. Never attacks the person — only the idea.",
    specialty:
      "Stress-tests arguments, finds edge cases, and ensures intellectual rigor in every discussion.",
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    defaultProvider: "openrouter",
    tools: ["web_search", "code_exec", "data_query"],
  },
  {
    role: "Innovator",
    name: "Daedalus",
    icon: "💡",
    color: "#d29922",
    personality:
      "Creative and boundary-pushing. Generates unconventional ideas and novel combinations. Thinks in metaphors and analogies.",
    specialty:
      "Proposes breakthrough ideas, creative solutions, and 'what if' scenarios that others wouldn't consider.",
    defaultModel: "openai/gpt-4o",
    defaultProvider: "openrouter",
    tools: ["image_gen", "file_write", "code_exec"],
  },
  {
    role: "Synthesizer",
    name: "Thesis",
    icon: "🧬",
    color: "#bc8cff",
    personality:
      "Calm, integrative, and pattern-seeking. Weaves disparate viewpoints into coherent frameworks. The bridge builder.",
    specialty:
      "Combines multiple perspectives into unified frameworks. Identifies common ground and builds consensus.",
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    defaultProvider: "openrouter",
    tools: ["file_write", "docx_gen", "xlsx_gen", "data_query"],
  },
  {
    role: "Domain Expert",
    name: "Meridian",
    icon: "🧭",
    color: "#3fb950",
    personality:
      "Deep expertise with practical orientation. Bridges theory and implementation. Focuses on what's actually buildable.",
    specialty:
      "Provides domain-specific technical depth. Knows the nuts and bolts of implementation.",
    defaultModel: "openai/gpt-4o",
    defaultProvider: "openrouter",
    tools: ["code_exec", "file_read", "file_write", "web_fetch"],
  },
  {
    role: "Facilitator",
    name: "Conductor",
    icon: "🎼",
    color: "#f0883e",
    personality:
      "Organizing and inclusive. Ensures all voices are heard. Keeps discussions focused and productive.",
    specialty:
      "Manages debate flow, summarizes progress, and ensures the conversation stays on track.",
    defaultModel: "openai/gpt-4o-mini",
    defaultProvider: "openrouter",
    tools: ["data_query", "file_write"],
  },
  {
    role: "Devil's Advocate",
    name: "Nyx",
    icon: "🔥",
    color: "#ff6b81",
    personality:
      "Provocative and contrarian. Forces the group to defend their positions. Plays the role of future skeptic.",
    specialty:
      "Challenges consensus, forces deeper reasoning, and prevents groupthink.",
    defaultModel: "openai/gpt-4o",
    defaultProvider: "openrouter",
    tools: ["web_search", "data_query"],
  },
  {
    role: "Analyst",
    name: "Cipher",
    icon: "📊",
    color: "#39d2c0",
    personality:
      "Data-first and quantitative. Converts qualitative claims into measurable metrics. Loves spreadsheets.",
    specialty:
      "Provides data analysis, metrics, and quantitative backing for qualitative claims.",
    defaultModel: "openai/gpt-4o",
    defaultProvider: "openrouter",
    tools: ["code_exec", "xlsx_gen", "file_write", "data_query"],
  },
];

export function createAgentFromTemplate(
  template: AgentTemplate,
  overrides?: Partial<Agent>
): Agent {
  return {
    id: overrides?.id || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: overrides?.name || template.name,
    role: template.role,
    status: "idle",
    icon: template.icon,
    color: template.color,
    model: overrides?.model || template.defaultModel,
    provider: overrides?.provider || template.defaultProvider,
    personality: overrides?.personality || template.personality,
    specialty: overrides?.specialty || template.specialty,
    tools: overrides?.tools || template.tools,
    score: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export const DEFAULT_AGENTS: Agent[] = AGENT_TEMPLATES.map((t) =>
  createAgentFromTemplate(t)
);
