"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Graph } from "@visx/network";
import { Agent, AgentConnection } from "@/lib/types";

interface Props {
  agents: Agent[];
  onRefresh: () => Promise<void>;
}

interface PositionedAgent extends Agent {
  x: number;
  y: number;
}

interface PositionedLink extends AgentConnection {
  source: PositionedAgent;
  target: PositionedAgent;
}

export function AgentNodeCanvas({ agents, onRefresh }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(
    Object.fromEntries(agents.map((agent) => [agent.id, { x: agent.x || 0, y: agent.y || 0 }]))
  );

  useEffect(() => {
    setNodePositions(Object.fromEntries(agents.map((agent) => [agent.id, { x: agent.x || 0, y: agent.y || 0 }])));
  }, [agents]);

  const connections = useMemo<AgentConnection[]>(
    () => [
      { id: "c1", from: agents[0]?.id || "", to: agents[1]?.id || "", label: "challenges" },
      { id: "c2", from: agents[1]?.id || "", to: agents[2]?.id || "", label: "informs" },
      { id: "c3", from: agents[2]?.id || "", to: agents[3]?.id || "", label: "synthesizes" },
      { id: "c4", from: agents[3]?.id || "", to: agents[0]?.id || "", label: "grounds" },
      { id: "c5", from: agents[4]?.id || "", to: agents[5]?.id || "", label: "facilitates" },
      { id: "c6", from: agents[5]?.id || "", to: agents[6]?.id || "", label: "provokes" },
      { id: "c7", from: agents[6]?.id || "", to: agents[7]?.id || "", label: "analyzes" },
    ],
    [agents]
  );

  const graph = useMemo(() => {
    const nodes: PositionedAgent[] = agents.map((agent) => ({
      ...agent,
      x: nodePositions[agent.id]?.x ?? agent.x ?? 0,
      y: nodePositions[agent.id]?.y ?? agent.y ?? 0,
    }));
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const links: PositionedLink[] = connections
      .map((conn) => ({
        ...conn,
        source: nodeMap[conn.from],
        target: nodeMap[conn.to],
      }))
      .filter((link) => link.source && link.target);
    return { nodes, links };
  }, [agents, connections, nodePositions]);

  const getAgentPos = useCallback(
    (id: string) => nodePositions[id] ?? { x: 0, y: 0 },
    [nodePositions]
  );

  const handleMouseDown = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    const position = nodePositions[agentId];
    if (!position) return;
    setSelectedAgent(agentId);
    setDragging(agentId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left - position.x, y: e.clientY - rect.top - position.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
      const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
      setNodePositions((prev) => ({
        ...prev,
        [dragging]: { x, y },
      }));
    },
    [dragging, dragOffset]
  );

  const handleMouseUp = useCallback(async () => {
    if (dragging) {
      const position = nodePositions[dragging];
      if (position) {
        await fetch(`/api/agents/${dragging}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x: position.x, y: position.y }),
        });
      }
    }
    setDragging(null);
  }, [dragging, nodePositions]);

  const selected = agents.find((a) => a.id === selectedAgent);

  const NodeComponent = ({ node }: { node: PositionedAgent }) => {
    const isActive = selectedAgent === node.id;
    return (
      <g
        transform={`translate(${node.x}, ${node.y})`}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAgent(node.id);
        }}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <foreignObject width={220} height={150}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className={`rounded-xl ${isActive ? "z-10" : "z-[2]"}`}
            style={{
              width: 220,
              height: 150,
              background: "rgba(13,17,23,0.92)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${isActive ? node.color : "var(--border)"}`,
              boxShadow: isActive
                ? `0 0 0 2px ${node.color}44, 0 8px 32px rgba(0,0,0,0.5)`
                : "0 4px 24px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center gap-2.5 p-3 border-b border-[var(--border)]">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: `${node.color}22` }}
              >
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: node.color }}>
                  {node.name}
                </div>
                <div className="text-[9px] text-[var(--text3)]">{node.role}</div>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    node.status === "idle"
                      ? "bg-[var(--green)]"
                      : node.status === "thinking"
                      ? "bg-[var(--yellow)] animate-pulse"
                      : "bg-[var(--text3)]"
                  }`}
                />
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[9px] text-[var(--text2)] leading-relaxed line-clamp-2">
                {node.specialty.slice(0, 80)}...
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-bold">{node.score}</span>
                <span className="text-[8px] text-[var(--text3)]">pts</span>
                <span className="text-[8px] text-[var(--text3)] ml-auto">{node.model.split("/").pop()}</span>
              </div>
            </div>
            <div className="absolute left-0 top-1/2 w-2 h-2 rounded-full bg-[var(--border2)] -translate-x-1/2 -translate-y-1/2 border border-[var(--bg)]" />
            <div className="absolute right-0 top-1/2 w-2 h-2 rounded-full bg-[var(--border2)] translate-x-1/2 -translate-y-1/2 border border-[var(--bg)]" />
          </div>
        </foreignObject>
      </g>
    );
  };

  const LinkComponent = ({ link }: { link: PositionedLink }) => {
    const fromX = link.source.x + 110;
    const fromY = link.source.y + 40;
    const toX = link.target.x + 110;
    const toY = link.target.y + 40;
    const isActive = selectedAgent === link.from || selectedAgent === link.to;
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    return (
      <g>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={isActive ? "var(--accent)" : "var(--border2)"}
          strokeWidth={isActive ? 2 : 1.5}
          opacity={isActive ? 0.7 : 0.4}
          strokeDasharray={isActive ? "none" : "4 4"}
        />
        {link.label && (
          <text x={midX} y={midY - 8} fill="var(--text2)" fontSize={10} textAnchor="middle" pointerEvents="none">
            {link.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-[calc(100vh-110px)] flex">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(88,166,255,0.02) 0%, transparent 70%), linear-gradient(rgba(30,38,51,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30,38,51,0.3) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 24px 24px, 24px 24px",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedAgent(null)}
      >
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <Graph
            graph={graph}
            linkComponent={({ link }) => <LinkComponent link={link as PositionedLink} />}
            nodeComponent={({ node }) => <NodeComponent node={node as PositionedAgent} />}
            top={0}
            left={0}
          />
        </svg>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="w-[320px] bg-[var(--bg2)] border-l border-[var(--border)] p-4 overflow-y-auto animate-slide-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: `${selected.color}22` }}>
              {selected.icon}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: selected.color }}>{selected.name}</div>
              <div className="text-[10px] text-[var(--text2)]">{selected.role} · {selected.model}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Personality</div>
              <div className="text-[11px] text-[var(--text2)] leading-relaxed">{selected.personality}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Specialty</div>
              <div className="text-[11px] text-[var(--text2)] leading-relaxed">{selected.specialty}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Tools</div>
              <div className="flex gap-1 flex-wrap">
                {selected.tools.map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg3)] text-[var(--text2)]">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selected.status === "idle" ? "bg-[var(--green)]" : "bg-[var(--yellow)] animate-pulse"}`} />
                <span className="text-[11px] capitalize">{selected.status}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Score</div>
              <div className="text-lg font-bold">{selected.score}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
