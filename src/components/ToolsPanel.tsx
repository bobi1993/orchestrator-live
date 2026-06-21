"use client";

import { ToolDefinition } from "@/lib/types";

interface Props {
  tools: ToolDefinition[];
}

const CATEGORY_COLORS: Record<string, string> = {
  search: "#58a6ff",
  code: "#3fb950",
  file: "#d29922",
  media: "#bc8cff",
  document: "#f0883e",
  data: "#39d2c0",
  web: "#ff6b81",
};

const CATEGORY_LABELS: Record<string, string> = {
  search: "Search & Research",
  code: "Code & Execution",
  file: "File Operations",
  media: "Media & Images",
  document: "Document Generation",
  data: "Data & Analytics",
  web: "Web & Browsing",
};

export function ToolsPanel({ tools }: Props) {
  const categories = Object.keys(
    tools.reduce(
      (acc, t) => {
        acc[t.category] = true;
        return acc;
      },
      {} as Record<string, boolean>
    )
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          🔧 Available Tools{" "}
          <span className="text-[var(--text2)] font-normal text-base">
            ({tools.length})
          </span>
        </h2>
        <p className="text-xs text-[var(--text3)] mt-1">
          Tools that agents can discover and call during debates. Each agent is
          assigned a subset of tools matching their role.
        </p>
      </div>

      {categories.map((category) => {
        const catTools = tools.filter((t) => t.category === category);
        const color = CATEGORY_COLORS[category] || "var(--accent)";
        return (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
              <h3 className="text-sm font-semibold" style={{ color }}>
                {CATEGORY_LABELS[category] || category}
              </h3>
              <span className="text-[10px] text-[var(--text3)]">
                ({catTools.length} tools)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catTools.map((tool) => (
                <div
                  key={tool.id}
                  className="card"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{tool.icon}</span>
                    <div>
                      <div className="text-sm font-semibold">{tool.name}</div>
                      <div className="text-[9px] text-[var(--text3)] font-mono">
                        {tool.id}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text2)] leading-relaxed mb-3">
                    {tool.description}
                  </p>
                  <div className="space-y-1">
                    {tool.parameters.map((param) => (
                      <div
                        key={param.name}
                        className="flex items-center gap-2 text-[10px]"
                      >
                        <code className="text-[var(--accent)] bg-[var(--bg3)] px-1 py-0.5 rounded">
                          {param.name}
                        </code>
                        <span className="text-[var(--text3)]">
                          {param.type}
                        </span>
                        {param.required && (
                          <span className="text-[var(--red)] text-[8px]">
                            required
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
