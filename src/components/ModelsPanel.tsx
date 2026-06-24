"use client";

import { LLMModel } from "@/lib/types";

interface Props {
  models: LLMModel[];
}

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: "#d97706",
  OpenAI: "#10b981",
  Google: "#3b82f6",
  Meta: "#6366f1",
  DeepSeek: "#8b5cf6",
  xAI: "#f59e0b",
  Mistral: "#06b6d4",
  Alibaba: "#f97316",
};

export function ModelsPanel({ models }: Props) {
  const providers = [...new Set(models.map(m => m.provider))];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          🧬 LLM Models <span className="text-[var(--text2)] font-normal text-base">({models.length})</span>
        </h2>
        <p className="text-xs text-[var(--text3)] mt-1">
          Available models across all providers. Assign models to agents via the Agents panel.
        </p>
      </div>

      {providers.map(provider => {
        const providerModels = models.filter(m => m.provider === provider);
        const color = PROVIDER_COLORS[provider] || "var(--accent)";
        return (
          <div key={provider} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <h3 className="text-sm font-semibold" style={{ color }}>{provider}</h3>
              <span className="text-[10px] text-[var(--text3)]">({providerModels.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {providerModels.map(model => (
                <div key={model.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">{model.name}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text3)] font-mono mb-2">{model.id}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text2)]">
                      Context: <strong>{(model.contextLength / 1000).toFixed(0)}K</strong> tokens
                    </span>
                    <div className="h-1.5 w-20 bg-[var(--bg3)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (model.contextLength / 2000000) * 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
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
