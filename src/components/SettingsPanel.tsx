"use client";

import { useState, useEffect } from "react";

const THEME_PRESETS = [
  { name: "Dark (Default)", bg: "#080c12", accent: "#58a6ff" },
  { name: "Midnight", bg: "#0a0a1a", accent: "#79c0ff" },
  { name: "Charcoal", bg: "#1a1a1a", accent: "#ff7b72" },
  { name: "Deep Blue", bg: "#000c17", accent: "#f0883e" },
  { name: "Purple Haze", bg: "#0d0b1a", accent: "#bc8cff" },
  { name: "Dark Green", bg: "#0a1a0a", accent: "#3fb950" },
];

const ACCENT_COLORS = [
  "#58a6ff", "#3fb950", "#f85149", "#bc8cff",
  "#f0883e", "#d29922", "#39d2c0", "#ff6b35",
  "#e056fd", "#ff6b81",
];

export function SettingsPanel() {
  const [fontSize, setFontSize] = useState(13);
  const [customBg, setCustomBg] = useState("");

  // Load saved settings
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedAccent = localStorage.getItem("accent");
    const savedFontSize = localStorage.getItem("font-size");
    const savedBg = localStorage.getItem("custom-bg");
    if (savedTheme) {
      const preset = THEME_PRESETS.find(p => p.name === savedTheme);
      if (preset) {
        document.documentElement.style.setProperty("--bg", preset.bg);
        document.documentElement.style.setProperty("--accent", preset.accent);
      }
    }
    if (savedAccent) document.documentElement.style.setProperty("--accent", savedAccent);
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
      document.body.style.fontSize = savedFontSize + "px";
    }
    if (savedBg) {
      setCustomBg(savedBg);
      document.body.style.backgroundImage = `url(${savedBg})`;
      document.body.style.backgroundSize = "cover";
    }
  }, []);

  const applyTheme = (preset: typeof THEME_PRESETS[0]) => {
    document.documentElement.style.setProperty("--bg", preset.bg);
    document.documentElement.style.setProperty("--accent", preset.accent);
    localStorage.setItem("theme", preset.name);
    localStorage.removeItem("custom-bg");
    document.body.style.backgroundImage = "";
  };

  const applyAccent = (color: string) => {
    document.documentElement.style.setProperty("--accent", color);
    localStorage.setItem("accent", color);
  };

  const applyFontSize = (size: number) => {
    setFontSize(size);
    document.body.style.fontSize = size + "px";
    localStorage.setItem("font-size", String(size));
  };

  const applyCustomBg = () => {
    if (customBg) {
      document.body.style.backgroundImage = `url(${customBg})`;
      document.body.style.backgroundSize = "cover";
      localStorage.setItem("custom-bg", customBg);
    }
  };

  const resetAll = () => {
    localStorage.clear();
    location.reload();
  };

  const exportIdeas = async () => {
    try {
      const r = await fetch("/api/ideas");
      const d = await r.json();
      const blob = new Blob([JSON.stringify(d.ideas || [], null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ideas.json";
      a.click();
    } catch { /* */ }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">🎨 Appearance & Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Theme Presets */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Theme Presets</h3>
          <div className="flex flex-col gap-2">
            {THEME_PRESETS.map(t => (
              <button
                key={t.name}
                onClick={() => applyTheme(t)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--border2)] transition-colors text-left"
              >
                <div className="w-4 h-4 rounded" style={{ background: t.bg, border: `1px solid ${t.accent}` }} />
                <span className="text-[11px]">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Accent Color</h3>
          <div className="flex gap-2 flex-wrap mb-4">
            {ACCENT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => applyAccent(c)}
                className="w-7 h-7 rounded-full cursor-pointer border-2 border-transparent hover:border-white transition-colors"
                style={{ background: c }}
              />
            ))}
          </div>
          <h3 className="text-sm font-semibold mb-3">Custom Background</h3>
          <input
            type="text"
            value={customBg}
            onChange={e => setCustomBg(e.target.value)}
            placeholder="Image URL..."
            className="w-full text-xs mb-2"
          />
          <div className="flex gap-2">
            <button onClick={applyCustomBg} className="btn bg-[var(--accent)] text-white text-[10px]">Apply</button>
            <button onClick={() => { document.body.style.backgroundImage = ""; localStorage.removeItem("custom-bg"); setCustomBg(""); }} className="btn bg-[var(--red)] text-white text-[10px]">Clear</button>
          </div>
        </div>

        {/* Font Size */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Font Size</h3>
          <input
            type="range"
            min="10"
            max="18"
            value={fontSize}
            onChange={e => applyFontSize(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-[11px] text-[var(--text2)] mt-1">{fontSize}px</div>
        </div>

        {/* Data */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Data</h3>
          <div className="flex flex-col gap-2">
            <button onClick={exportIdeas} className="btn bg-[var(--accent)] text-white text-[10px] justify-center">
              📥 Export Ideas as JSON
            </button>
            <button onClick={resetAll} className="btn bg-[var(--red)] text-white text-[10px] justify-center">
              🔄 Reset All Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
