"use client";

import { useState } from "react";
import { Notification } from "@/lib/types";

interface Props {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  info: "ℹ️", success: "✅", warning: "⚠️", error: "❌",
};
const TYPE_COLORS: Record<string, string> = {
  info: "var(--accent)", success: "var(--green)", warning: "var(--yellow)", error: "var(--red)",
};

export function NotificationCenter({ notifications, onMarkAllRead, onClose }: Props) {
  return (
    <div className="absolute top-full right-0 w-[360px] max-h-[480px] bg-[var(--bg2)] border border-[var(--border)] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-[200] flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold">Notifications</h3>
        <div className="flex gap-2">
          <button onClick={onMarkAllRead} className="text-[10px] text-[var(--accent)] bg-transparent border-none cursor-pointer hover:underline">
            Mark all read
          </button>
          <button onClick={onClose} className="text-[10px] text-[var(--text3)] bg-transparent border-none cursor-pointer hover:text-[var(--text)]">
            ✕
          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 max-h-[400px]">
        {notifications.length === 0 ? (
          <div className="text-center text-[var(--text3)] text-xs py-8">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 border-b border-[var(--border)] transition-colors hover:bg-[var(--bg3)] ${!n.read ? "border-l-2" : ""}`}
              style={!n.read ? { borderLeftColor: TYPE_COLORS[n.type] } : {}}
            >
              <span className="text-sm flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold">{n.title}</div>
                <div className="text-[10px] text-[var(--text2)] mt-0.5 leading-relaxed">{n.message}</div>
                <div className="text-[9px] text-[var(--text3)] mt-1">
                  {new Date(n.timestamp).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: TYPE_COLORS[n.type] }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
