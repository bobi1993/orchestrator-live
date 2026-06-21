"use client";

import { useState } from "react";
import { Idea } from "@/lib/types";

interface Props {
  ideas: Idea[];
  onRefresh: () => Promise<void>;
}

export function IdeasPanel({ ideas, onRefresh }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "votes">("newest");

  const filtered =
    filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "votes") return b.votes - a.votes;
    return (
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  const statusColor = (status: string) => {
    if (status === "approved") return "var(--green)";
    if (status === "rejected") return "var(--red)";
    return "var(--yellow)";
  };

  const vote = async (ideaId: string, action: string) => {
    await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId, action }),
    });
    await onRefresh();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          💡 All Ideas{" "}
          <span className="text-[var(--text2)] font-normal text-base">
            ({ideas.length})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "votes")}
            className="text-[11px] py-1.5"
          >
            <option value="newest">Newest First</option>
            <option value="votes">Most Votes</option>
          </select>
          {/* Filter */}
          <div className="flex gap-1">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] capitalize transition-colors ${
                  filter === f
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">💡</div>
          <p className="text-[var(--text3)] text-sm">
            No ideas match this filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((idea) => {
            const sc = statusColor(idea.status);
            return (
              <div
                key={idea.id}
                className="card animate-fade-in"
                style={{ borderLeft: `3px solid ${sc}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="badge"
                    style={{ background: `${sc}22`, color: sc }}
                  >
                    {idea.status}
                  </span>
                  <span className="text-[10px] text-[var(--text2)]">
                    {idea.authorName}
                  </span>
                  <span className="ml-auto text-xs font-bold">
                    ▲ {idea.votes}
                  </span>
                </div>

                <p className="text-sm leading-relaxed mb-3">{idea.text}</p>

                {idea.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--bg3)] text-[var(--text3)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-[var(--text3)] mb-3">
                  {new Date(idea.timestamp).toLocaleString()}
                </div>

                {idea.status === "pending" && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => vote(idea.id, "approve")}
                      className="btn bg-transparent border border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white text-[10px]"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => vote(idea.id, "reject")}
                      className="btn bg-transparent border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white text-[10px]"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => vote(idea.id, "upvote")}
                      className="btn bg-transparent border border-[var(--border)] text-[var(--text2)] text-[10px]"
                    >
                      ▲ Vote
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
