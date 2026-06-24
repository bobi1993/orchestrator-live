"use client";

import { useState } from "react";
import { LLMModel } from "@/lib/types";

interface Props {
  models: LLMModel[];
  onSelect?: (model: LLMModel) => void;
  selectedModel?: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  Ollama: "#f59e0b",
  Anthropic: "#d97706",
  OpenAI: "#10b981",
  Google: "#3b82f6",
  Meta: "#6366f1",
  DeepSeek: "#8b5cf6",
  xAI: "#f59e0b",
  Mistral: "#06b6d4",
  Alibaba: "#f97316",
  OpenRouter: "#ec4899",
};

const PROVIDER_ICONS: Record<string, string> = {
  Ollama: "🏠",
  Anthropic: "🧠",
  OpenAI: "⚡",
  Google: "✨",
  Meta: "🔷",
  DeepSeek: "🐋",
  xAI: "🤖",
  Mistral: "🌊",
  Alibaba: "🐉",
  OpenRouter: "🔀",
};

type TabType = "all" | "local" | "free" | "paid";

export function ModelsPanel({ models, onSelect, selectedModel }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const localModels = models.filter((m) => m.isLocal);
  const freeCloudModels = models.filter((m) => m.isFree && !m.isLocal);
  const paidModels = models.filter((m) => !m.isFree);

  const filterModels = (modelList: LLMModel[]) => {
    if (!searchQuery) return modelList;
    const q = searchQuery.toLowerCase();
    return modelList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
    );
  };

  const displayModels =
    activeTab === "all"
      ? filterModels(models)
      : activeTab === "local"
        ? filterModels(localModels)
        : activeTab === "free"
          ? filterModels(freeCloudModels)
          : filterModels(paidModels);

  const tabs: { id: TabType; label: string; count: number; icon: string }[] = [
    { id: "all", label: "All", count: models.length, icon: "🧬" },
    { id: "local", label: "Local", count: localModels.length, icon: "🏠" },
    { id: "free", label: "Free Cloud", count: freeCloudModels.length, icon: "🎁" },
    { id: "paid", label: "Paid", count: paidModels.length, icon: "💎" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">
            🧬 Model Store{" "}
            <span className="text-[var(--text2)] font-normal text-base">
              ({models.length} models)
            </span>
          </h2>
          <div className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            {localModels.length + freeCloudModels.length} free models available
          </div>
        </div>
        <p className="text-xs text-[var(--text3)]">
          Priority: Local (unlimited) → Free Cloud → Paid (fallback when free
          exhausted)
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search models, providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-[var(--bg2)] border border-[var(--bg3)] text-sm text-[var(--text1)] placeholder-[var(--text3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20"
                : "bg-[var(--bg2)] text-[var(--text2)] hover:bg-[var(--bg3)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? "bg-white/20"
                  : "bg-[var(--bg3)] text-[var(--text3)]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Model Grid */}
      {displayModels.length === 0 ? (
        <div className="text-center py-12 text-[var(--text3)]">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">No models found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayModels.map((model) => {
            const color = PROVIDER_COLORS[model.provider] || "var(--accent)";
            const icon = PROVIDER_ICONS[model.provider] || "🔮";
            const isSelected = selectedModel === model.id;

            return (
              <div
                key={model.id}
                onClick={() => onSelect?.(model)}
                className={`card cursor-pointer transition-all hover:scale-[1.02] ${
                  isSelected ? "ring-2 ring-[var(--accent)]" : ""
                }`}
                style={{
                  borderLeft: `3px solid ${color}`,
                  opacity: model.isFree ? 1 : 0.85,
                }}
              >
                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-sm font-semibold">{model.name}</span>
                  {model.isLocal && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                      LOCAL
                    </span>
                  )}
                  {model.isFree && !model.isLocal && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                      FREE
                    </span>
                  )}
                  {!model.isFree && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">
                      PAID
                    </span>
                  )}
                  {model.speed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {model.speed === "fast"
                        ? "⚡fast"
                        : model.speed === "medium"
                          ? "⏳medium"
                          : "🐢slow"}
                    </span>
                  )}
                </div>

                {/* Provider */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">{icon}</span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color }}
                  >
                    {model.provider}
                  </span>
                </div>

                {/* Model ID */}
                <div className="text-[10px] text-[var(--text3)] font-mono mb-2 truncate">
                  {model.id}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text2)]">
                    Context:{" "}
                    <strong>
                      {model.contextLength >= 1000000
                        ? `${(model.contextLength / 1000000).toFixed(1)}M`
                        : `${(model.contextLength / 1000).toFixed(0)}K`}
                    </strong>{" "}
                    tokens
                  </span>
                  {model.pricing && (
                    <span className="text-[10px] text-[var(--text3)]">
                      {model.pricing}
                    </span>
                  )}
                </div>

                {/* Context bar */}
                <div className="mt-2 h-1 w-full bg-[var(--bg3)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (model.contextLength / 2000000) * 100)}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback Strategy Info */}
      <div className="mt-8 p-4 rounded-lg bg-[var(--bg2)] border border-[var(--bg3)]">
        <h3 className="text-sm font-semibold mb-2">
          🔄 Auto-Fallback Strategy
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--text2)] flex-wrap">
          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">
            1. Local (Ollama)
          </span>
          <span>→</span>
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
            2. Free Cloud
          </span>
          <span>→</span>
          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
            3. Paid (if free exhausted)
          </span>
        </div>
        <p className="text-[10px] text-[var(--text3)] mt-2">
          When a provider returns 429 (rate limit) or 402 (quota exceeded),
          the system automatically switches to the next available free model.
          Paid models are only used when all free options are exhausted.
        </p>
      </div>
    </div>
  );
}
