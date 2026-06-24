"use client";

// ═══════════════════════════════════════════════════════════════
// VibeCodePanel — AI-assisted coding interface
//
// TO ADD THIS TAB TO THE DASHBOARD, make these changes in src/app/page.tsx:
//
// 1. Add "vibe" to the Panel type union (line ~17):
//    type Panel = "overview" | "debate" | ... | "settings" | "vibe";
//
// 2. Add a tab entry to the TABS array (after the "settings" entry, line ~29):
//    { id: "vibe", icon: "✨", label: "Vibe Code" },
//
// 3. Import this component at the top of the file (with the other imports):
//    import { VibeCodePanel } from "@/components/VibeCodePanel";
//
// 4. Add the panel render inside the <main> block (after the settings panel, line ~209):
//    {panel === "vibe" && <VibeCodePanel />}
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from "react";

const PROJECTS = [
  "Desktop/DashCommanderView/frontend",
  "Desktop/vr video/frontend/src",
  "Desktop/vr video/backend",
  "hermes-studio/packages/client/src",
  "face/orchestrator-live/src",
];

const ENDPOINT_PRESETS = [
  { label: "Local (11434)", value: "http://localhost:11434" },
  { label: "Cloud (11435)", value: "http://localhost:11435" },
  { label: "Remote GPU (11436)", value: "http://localhost:11436" },
];

const MODEL_PRESETS = [
  { label: "qwen3-coder:480b-cloud", value: "qwen3-coder:480b-cloud" },
  { label: "llama3.2:latest", value: "llama3.2:latest" },
  { label: "llama3.2:1b", value: "llama3.2:1b" },
];

interface OllamaModel { id: string; label: string; size: string | null; }

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  depth?: number;
}

interface HistoryEntry {
  id: string;
  request: string;
  response: string;
  timestamp: string;
  collapsed: boolean;
}

interface Commit {
  hash: string;
  author: string;
  ago: string;
  message: string;
  files: string[];
}

interface SessionSummary {
  session: string;
  preview: string;
  size: string;
}

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  command: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  lastRun: string | null;
  lastStatus: "ok" | "error" | "pending" | null;
  tags: string[];
}

function extractCodeBlock(text: string): string | null {
  const match = text.match(/```[\w]*\n?([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export function VibeCodePanel() {
  // Left panel state
  const [selectedProject, setSelectedProject] = useState("face/orchestrator-live/src");
  const [customPath, setCustomPath] = useState("");
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileSearch, setFileSearch] = useState("");

  // Ollama endpoint + model discovery
  const [endpoint, setEndpoint] = useState(ENDPOINT_PRESETS[0].value);
  const [endpointInput, setEndpointInput] = useState(ENDPOINT_PRESETS[0].value);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<"ok" | "error" | "loading">("loading");

  // Right panel state
  const [request, setRequest] = useState("");
  const [model, setModel] = useState("");
  const [response, setResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Activity panel state
  const [commits, setCommits] = useState<Commit[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<"commits" | "sessions" | "automate">("commits");

  // Automation tasks state
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);
  const [loadingAutomation, setLoadingAutomation] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCommand, setNewTaskCommand] = useState("");
  const [newTaskSchedule, setNewTaskSchedule] = useState("manual");
  const [addingTask, setAddingTask] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Load activity feed
  const loadActivity = useCallback(async (project: string) => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/vibe/activity?project=${encodeURIComponent(project)}`);
      const data = await res.json();
      setCommits(data.commits || []);
      setSessions(data.sessions || []);
    } catch {
      setCommits([]);
      setSessions([]);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  // Load automation tasks
  const loadAutomation = useCallback(async () => {
    setLoadingAutomation(true);
    try {
      const res = await fetch("/api/brain/automate");
      const data = await res.json();
      setAutomationTasks(data.tasks || []);
    } catch {
      setAutomationTasks([]);
    } finally {
      setLoadingAutomation(false);
    }
  }, []);

  const createTask = useCallback(async () => {
    if (!newTaskName.trim() || !newTaskCommand.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/brain/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTaskName,
          command: newTaskCommand,
          schedule: newTaskSchedule,
          description: "",
          createdBy: "VibeCode",
        }),
      });
      const data = await res.json();
      if (data.task) {
        setAutomationTasks((prev) => [...prev, data.task]);
        setNewTaskName("");
        setNewTaskCommand("");
        setNewTaskSchedule("manual");
      }
    } finally {
      setAddingTask(false);
    }
  }, [newTaskName, newTaskCommand, newTaskSchedule]);

  const toggleTask = useCallback(async (id: string, enabled: boolean) => {
    await fetch("/api/brain/automate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setAutomationTasks((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !enabled } : t));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await fetch(`/api/brain/automate?id=${id}`, { method: "DELETE" });
    setAutomationTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch available models from Ollama endpoint
  const loadModels = useCallback(async (ep: string) => {
    setLoadingModels(true);
    setOllamaStatus("loading");
    try {
      const res = await fetch(`/api/vibe/models?endpoint=${encodeURIComponent(ep)}`);
      const data = await res.json();
      if (data.error && data.models.length === 0) {
        setOllamaStatus("error");
        setOllamaModels([]);
      } else {
        setOllamaModels(data.models || []);
        setOllamaStatus("ok");
        if (data.models?.length > 0) {
          setModel((prev) => {
            const still = data.models.find((m: OllamaModel) => m.id === prev);
            return still ? prev : data.models[0].id;
          });
        }
      }
    } catch {
      setOllamaStatus("error");
      setOllamaModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Load models when endpoint changes
  useEffect(() => { loadModels(endpoint); }, [endpoint, loadModels]);

  // Load file tree when project changes
  const loadFiles = useCallback(async (project: string) => {
    setLoadingFiles(true);
    setFiles([]);
    setSelectedFile(null);
    setFileContent("");
    try {
      const res = await fetch(`/api/vibe/files?path=${encodeURIComponent(project)}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(selectedProject);
    loadActivity(selectedProject);
  }, [selectedProject, loadFiles, loadActivity]);

  useEffect(() => { loadAutomation(); }, [loadAutomation]);

  // Handle dropped files/folders — read content directly from File API
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const items = Array.from(e.dataTransfer.items);
    const dropped: FileNode[] = [];

    for (const item of items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (!file) continue;
      const text = await file.text().catch(() => "");
      const node: FileNode = { name: file.name, path: file.name, type: "file", depth: 0 };
      dropped.push(node);
      // Auto-open the dropped file content
      if (items.length === 1) {
        setSelectedFile(file.name);
        setFileContent(text);
        setApplyResult(null);
      }
    }
    if (dropped.length > 0) {
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => f.path));
        return [...prev, ...dropped.filter((d) => !existing.has(d.path))];
      });
    }
  }, []);

  // Load file content
  const loadFile = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    setLoadingContent(true);
    setFileContent("");
    setApplyResult(null);
    try {
      const res = await fetch(`/api/vibe/files?path=${encodeURIComponent(filePath)}&content=true`);
      const data = await res.json();
      setFileContent(data.content || "");
    } catch {
      setFileContent("// Error loading file");
    } finally {
      setLoadingContent(false);
    }
  }, []);

  // Send request and stream response
  const sendRequest = useCallback(async () => {
    if (!request.trim() || streaming) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const currentRequest = request.trim();
    setRequest("");
    setResponse("");
    setApplyResult(null);
    setStreaming(true);

    let fullResponse = "";
    try {
      const res = await fetch("/api/vibe/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentRequest,
          model,
          endpoint,
          filePath: selectedFile,
          fileContent: selectedFile ? fileContent : undefined,
          project: selectedProject,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setResponse(`Error: ${err.error || res.statusText}`);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Handle SSE format or plain text
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || parsed.content || parsed.text || "";
              fullResponse += delta;
              setResponse(fullResponse);
            } catch {
              // plain text chunk
              fullResponse += data;
              setResponse(fullResponse);
            }
          } else if (line && !line.startsWith(":")) {
            fullResponse += line;
            setResponse(fullResponse);
          }
        }
        // Scroll response into view
        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setResponse(`Error: ${err.message}`);
      }
    } finally {
      setStreaming(false);
      if (fullResponse) {
        const entry: HistoryEntry = {
          id: Date.now().toString(),
          request: currentRequest,
          response: fullResponse,
          timestamp: new Date().toLocaleTimeString(),
          collapsed: false,
        };
        setHistory((prev) => [entry, ...prev].slice(0, 5));
      }
    }
  }, [request, streaming, model, selectedFile, fileContent, selectedProject]);

  // Apply code to file
  const applyCode = useCallback(async (code: string) => {
    if (!selectedFile) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch("/api/vibe/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: selectedFile, code, project: selectedProject }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyResult("✓ Applied to file");
        setFileContent(code);
      } else {
        setApplyResult(`✗ ${data.error || "Apply failed"}`);
      }
    } catch (err: unknown) {
      setApplyResult(`✗ ${err instanceof Error ? err.message : "Apply failed"}`);
    } finally {
      setApplying(false);
    }
  }, [selectedFile, selectedProject]);

  const toggleHistory = (id: string) => {
    setHistory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, collapsed: !e.collapsed } : e))
    );
  };

  const codeInResponse = response ? extractCodeBlock(response) : null;

  // ── Styles ──────────────────────────────────────────────────

  const s = {
    root: {
      display: "flex",
      height: "100%",
      overflow: "hidden",
      background: "var(--bg)",
    } as React.CSSProperties,

    leftPanel: {
      width: "40%",
      minWidth: 280,
      display: "flex",
      flexDirection: "column" as const,
      borderRight: "1px solid var(--border)",
      overflow: "hidden",
    } as React.CSSProperties,

    rightPanel: {
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      overflow: "hidden",
    } as React.CSSProperties,

    sectionHeader: {
      padding: "10px 14px",
      borderBottom: "1px solid var(--border)",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text3)",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      background: "var(--bg2)",
      display: "flex",
      alignItems: "center",
      gap: 6,
    } as React.CSSProperties,

    select: {
      width: "100%",
      background: "var(--bg3)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      padding: "7px 10px",
      borderRadius: 6,
      fontSize: 12,
      outline: "none",
    } as React.CSSProperties,

    fileTree: {
      flex: 1,
      overflowY: "auto" as const,
      padding: "6px 0",
    } as React.CSSProperties,

    fileItem: (active: boolean): React.CSSProperties => ({
      padding: "5px 14px",
      fontSize: 11,
      cursor: "pointer",
      color: active ? "var(--accent)" : "var(--text2)",
      background: active ? "rgba(88,166,255,0.08)" : "transparent",
      borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
      fontFamily: "monospace",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      transition: "all 0.1s",
    }),

    fileContentArea: {
      height: "45%",
      borderTop: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column" as const,
      overflow: "hidden",
    } as React.CSSProperties,

    pre: {
      flex: 1,
      margin: 0,
      padding: "10px 14px",
      fontSize: 11,
      lineHeight: 1.6,
      fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
      color: "var(--text)",
      background: "var(--bg)",
      overflowY: "auto" as const,
      whiteSpace: "pre" as const,
    } as React.CSSProperties,

    rightInner: {
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      padding: 14,
      gap: 10,
      overflowY: "auto" as const,
    } as React.CSSProperties,

    label: {
      fontSize: 11,
      color: "var(--text3)",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.4px",
      marginBottom: 4,
      display: "block",
    } as React.CSSProperties,

    textarea: (minH: number): React.CSSProperties => ({
      width: "100%",
      minHeight: minH,
      background: "var(--bg3)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      padding: "10px 12px",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "inherit",
      resize: "vertical" as const,
      outline: "none",
      boxSizing: "border-box" as const,
      lineHeight: 1.5,
    }),

    row: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
    } as React.CSSProperties,

    btn: (color: string, disabled?: boolean): React.CSSProperties => ({
      padding: "8px 16px",
      borderRadius: 8,
      border: "none",
      background: disabled ? "var(--bg3)" : color,
      color: disabled ? "var(--text3)" : "#fff",
      fontSize: 12,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.2s",
      opacity: disabled ? 0.5 : 1,
    }),

    responseBox: {
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "10px 12px",
      fontSize: 12,
      fontFamily: '"SF Mono", "Fira Code", monospace',
      color: "var(--text)",
      whiteSpace: "pre-wrap" as const,
      overflowY: "auto" as const,
      maxHeight: 320,
      lineHeight: 1.6,
      minHeight: 80,
    } as React.CSSProperties,

    historyEntry: {
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      overflow: "hidden",
    } as React.CSSProperties,

    historyHeader: {
      padding: "8px 12px",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 11,
      color: "var(--text2)",
      userSelect: "none" as const,
    } as React.CSSProperties,

    activityPanel: {
      width: "28%",
      minWidth: 220,
      display: "flex",
      flexDirection: "column" as const,
      borderLeft: "1px solid var(--border)",
      overflow: "hidden",
      background: "var(--bg)",
    } as React.CSSProperties,

    commitCard: (expanded: boolean): React.CSSProperties => ({
      borderBottom: "1px solid var(--border)",
      padding: "8px 12px",
      cursor: "pointer",
      background: expanded ? "rgba(88,166,255,0.05)" : "transparent",
      transition: "background 0.1s",
    }),

    pill: (color: string): React.CSSProperties => ({
      display: "inline-block",
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 700,
      background: color,
      color: "#fff",
      marginRight: 4,
    }),
  };

  const filesByDir: Record<string, FileNode[]> = {};
  for (const f of files) {
    const parts = f.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
    if (!filesByDir[dir]) filesByDir[dir] = [];
    filesByDir[dir].push(f);
  }

  return (
    <div style={s.root}>
      {/* ── LEFT PANEL ── */}
      <div style={s.leftPanel}>
        {/* Project selector */}
        <div style={{ ...s.sectionHeader }}>⚡ Vibe Code — Project</div>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", display: "flex", flexDirection: "column", gap: 6 }}>
          <select
            style={s.select}
            value={selectedProject}
            onChange={(e) => { setSelectedProject(e.target.value); setCustomPath(""); setFileSearch(""); }}
          >
            {PROJECTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {/* Custom path input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customPath.trim()) { loadFiles(customPath.trim()); loadActivity(customPath.trim()); }
            }}
            style={{ display: "flex", gap: 6 }}
          >
            <input
              style={{ ...s.select, flex: 1, padding: "5px 8px", fontSize: 11 }}
              placeholder="Or type any path… e.g. Desktop/my-project"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
            />
            <button type="submit" style={s.btn("var(--accent)", !customPath.trim())} disabled={!customPath.trim()}>
              Go
            </button>
          </form>
        </div>

        {/* Drag-and-drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            margin: "8px 10px",
            borderRadius: 8,
            border: `2px dashed ${isDragOver ? "var(--accent)" : "var(--border)"}`,
            background: isDragOver ? "rgba(88,166,255,0.08)" : "transparent",
            padding: "10px 12px",
            textAlign: "center",
            fontSize: 11,
            color: isDragOver ? "var(--accent)" : "var(--text3)",
            cursor: "default",
            transition: "all 0.15s",
          }}
        >
          {isDragOver ? "Drop to open file" : "⬆ Drag & drop files here"}
        </div>

        {/* File search + header */}
        <div style={{ ...s.sectionHeader, background: "var(--bg)", flexDirection: "column", gap: 6, alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>📁 Files</span>
            {loadingFiles && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--accent)" }}>Loading…</span>}
            {!loadingFiles && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text3)" }}>{files.length} items</span>}
          </div>
          <input
            style={{ ...s.select, padding: "4px 8px", fontSize: 11, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
            placeholder="Filter files…"
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
          />
        </div>

        <div style={s.fileTree}>
          {!loadingFiles && files.length === 0 && (
            <div style={{ padding: "20px 14px", fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
              No files found
            </div>
          )}
          {files
            .filter((f) => !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase()))
            .map((f) => (
              <div
                key={f.path}
                style={{ ...s.fileItem(selectedFile === f.path), paddingLeft: 14 + (f.depth || 0) * 12 }}
                onClick={() => f.type === "file" && loadFile(f.path)}
                title={f.path}
              >
                {f.type === "dir" ? "📁" : "📄"} {f.name}
              </div>
            ))
          }
        </div>

        {/* Current file content */}
        <div style={s.fileContentArea}>
          <div style={{ ...s.sectionHeader, background: "var(--bg2)" }}>
            📝 {selectedFile ? selectedFile.split("/").pop() : "No file selected"}
            {loadingContent && (
              <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--accent)" }}>Loading…</span>
            )}
          </div>
          <pre style={s.pre}>
            {selectedFile
              ? loadingContent
                ? "// Loading…"
                : fileContent || "// Empty file"
              : "// Select a file to view its contents"}
          </pre>
        </div>
      </div>

      {/* ── MIDDLE PANEL (AI) ── */}
      <div style={s.rightPanel}>
        <div style={{ ...s.sectionHeader, background: "var(--bg2)" }}>
          🤖 AI Request
          {selectedFile && (
            <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text3)", fontWeight: 400, textTransform: "none" }}>
              → {selectedFile.split("/").pop()}
            </span>
          )}
        </div>
        <div style={s.rightInner} ref={responseRef}>
          {/* Request textarea */}
          <div>
            <label style={s.label}>Request</label>
            <textarea
              style={s.textarea(100)}
              placeholder="What do you want to do? (e.g. 'add dark mode toggle', 'fix the auth bug', 'refactor this to use Pinia')"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendRequest();
              }}
            />
          </div>

          {/* Endpoint + Model selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>
                  Ollama endpoint
                  <span style={{
                    marginLeft: 8,
                    fontSize: 9,
                    color: ollamaStatus === "ok" ? "var(--green)" : ollamaStatus === "error" ? "var(--red)" : "var(--text3)",
                  }}>
                    {ollamaStatus === "ok" ? `● ${ollamaModels.length} models` : ollamaStatus === "error" ? "● unreachable" : "● connecting…"}
                  </span>
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    style={{ ...s.select, flex: 1, padding: "5px 8px", fontSize: 11 }}
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setEndpoint(endpointInput); } }}
                    placeholder="http://localhost:11434"
                  />
                  <select
                    style={{ ...s.select, width: "auto", padding: "5px 6px", fontSize: 10 }}
                    value=""
                    onChange={(e) => { if (e.target.value) { setEndpointInput(e.target.value); setEndpoint(e.target.value); } }}
                  >
                    <option value="">presets</option>
                    {ENDPOINT_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <button
                    style={s.btn("var(--purple)", loadingModels)}
                    disabled={loadingModels}
                    onClick={() => { setEndpoint(endpointInput); }}
                    title="Connect to this endpoint"
                  >
                    {loadingModels ? "…" : "↻"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Model selector + send */}
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Model</label>
              <select
                style={{ ...s.select, width: "100%" }}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {ollamaModels.length === 0 ? (
                  MODEL_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))
                ) : (
                  ollamaModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}{m.size ? ` (${m.size})` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              style={s.btn("var(--accent)", streaming || !request.trim())}
              disabled={streaming || !request.trim()}
              onClick={sendRequest}
            >
              {streaming ? "⏳ Streaming…" : "▶ Send"}&nbsp;
              <span style={{ fontSize: 9, opacity: 0.7 }}>⌘↵</span>
            </button>
            {streaming && (
              <button
                style={s.btn("var(--red)")}
                onClick={() => abortRef.current?.abort()}
              >
                ✕ Stop
              </button>
            )}
          </div>

          {/* Response area */}
          {(response || streaming) && (
            <div>
              <label style={s.label}>
                Response
                {streaming && (
                  <span style={{ marginLeft: 8, color: "var(--green)", fontSize: 9, animation: "pulse-glow 1.5s ease-in-out infinite" }}>
                    ● streaming
                  </span>
                )}
              </label>
              <div style={s.responseBox}>
                {response || "…"}
              </div>

              {/* Apply to file button */}
              {codeInResponse && selectedFile && !streaming && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    style={s.btn("var(--green)", applying)}
                    disabled={applying}
                    onClick={() => applyCode(codeInResponse)}
                  >
                    {applying ? "⏳ Applying…" : "✦ Apply to file"}
                  </button>
                  {applyResult && (
                    <span style={{
                      fontSize: 11,
                      color: applyResult.startsWith("✓") ? "var(--green)" : "var(--red)",
                    }}>
                      {applyResult}
                    </span>
                  )}
                </div>
              )}
              {codeInResponse && !selectedFile && !streaming && (
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--yellow)" }}>
                  ⚠ Select a file on the left to enable "Apply to file"
                </div>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <label style={{ ...s.label, marginTop: 6 }}>History (last {history.length})</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map((entry) => (
                  <div key={entry.id} style={s.historyEntry}>
                    <div
                      style={s.historyHeader}
                      onClick={() => toggleHistory(entry.id)}
                    >
                      <span style={{ fontFamily: "monospace", color: "var(--text)", maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.request}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--text3)" }}>{entry.timestamp}</span>
                        <span>{entry.collapsed ? "▶" : "▼"}</span>
                      </span>
                    </div>
                    {!entry.collapsed && (
                      <div style={{
                        padding: "8px 12px",
                        borderTop: "1px solid var(--border)",
                        fontSize: 11,
                        fontFamily: '"SF Mono", "Fira Code", monospace',
                        color: "var(--text2)",
                        whiteSpace: "pre-wrap",
                        maxHeight: 200,
                        overflowY: "auto",
                        background: "var(--bg)",
                      }}>
                        {entry.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVITY PANEL ── */}
      <div style={s.activityPanel}>
        <div style={s.sectionHeader}>
          📊 Activity
          <button
            onClick={() => { loadActivity(selectedProject); loadAutomation(); }}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 11, padding: 0 }}
          >
            {loadingActivity ? "…" : "↻"}
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {(["commits", "sessions", "automate"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActivityTab(tab)}
              style={{
                flex: 1, padding: "5px 0", fontSize: 10, background: "none", border: "none",
                borderBottom: activityTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                color: activityTab === tab ? "var(--accent)" : "var(--text3)",
                cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: 0.5,
              }}
            >
              {tab === "commits" ? "🔀 Git" : tab === "sessions" ? "🤖 Sessions" : "⚡ Automate"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto" as const }}>
          {/* ── GIT COMMITS TAB ── */}
          {activityTab === "commits" && (
            <>
              <div style={{ ...s.sectionHeader, background: "var(--bg2)", fontSize: 10 }}>
                {selectedProject.split("/").pop()}
              </div>
              {commits.length === 0 && !loadingActivity && (
                <div style={{ padding: "12px", fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                  No commits found
                </div>
              )}
              {commits.map((c) => (
                <div
                  key={c.hash}
                  style={s.commitCard(expandedCommit === c.hash)}
                  onClick={() => setExpandedCommit(expandedCommit === c.hash ? null : c.hash)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={s.pill("rgba(88,166,255,0.6)")}>{c.hash}</span>
                    <span style={{ fontSize: 9, color: "var(--text3)" }}>{c.ago}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.4, marginBottom: 2 }}>
                    {c.message.slice(0, 72)}{c.message.length > 72 ? "…" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{c.author}</div>
                  {expandedCommit === c.hash && c.files.length > 0 && (
                    <div style={{ marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                      {c.files.map((f) => (
                        <div key={f} style={{ fontSize: 10, color: "var(--green)", fontFamily: "monospace", lineHeight: 1.6 }}>
                          + {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── AGENT SESSIONS TAB ── */}
          {activityTab === "sessions" && (
            <>
              <div style={{ ...s.sectionHeader, background: "var(--bg2)", fontSize: 10 }}>
                Claude Sessions
              </div>
              {sessions.length === 0 && (
                <div style={{ padding: "12px", fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                  No sessions found
                </div>
              )}
              {sessions.map((s2, i) => (
                <div key={i} style={{ borderBottom: "1px solid var(--border)", padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={s.pill("rgba(192,132,252,0.6)")}>session</span>
                    <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "monospace" }}>{s2.session}</span>
                    <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text3)" }}>{s2.size}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" as const }}>
                    {s2.preview.slice(0, 160)}{s2.preview.length > 160 ? "…" : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── AUTOMATE TAB ── */}
          {activityTab === "automate" && (
            <>
              <div style={{ ...s.sectionHeader, background: "var(--bg2)", fontSize: 10 }}>
                Scheduled Tasks
                <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text3)" }}>
                  GET /api/brain · POST /api/brain/automate
                </span>
              </div>

              {/* New task form */}
              <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
                <input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Task name…"
                  style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 6px", color: "var(--text)", fontSize: 11, marginBottom: 4, boxSizing: "border-box" as const }}
                />
                <input
                  value={newTaskCommand}
                  onChange={(e) => setNewTaskCommand(e.target.value)}
                  placeholder="Command or description…"
                  style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 6px", color: "var(--text)", fontSize: 11, marginBottom: 4, boxSizing: "border-box" as const }}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  <select
                    value={newTaskSchedule}
                    onChange={(e) => setNewTaskSchedule(e.target.value)}
                    style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 6px", color: "var(--text)", fontSize: 11 }}
                  >
                    <option value="manual">manual</option>
                    <option value="0 * * * *">hourly</option>
                    <option value="0 0 * * *">daily</option>
                    <option value="0 0 * * 0">weekly</option>
                    <option value="*/15 * * * *">every 15m</option>
                  </select>
                  <button
                    onClick={createTask}
                    disabled={addingTask || !newTaskName.trim() || !newTaskCommand.trim()}
                    style={{ padding: "4px 10px", background: "var(--accent)", border: "none", borderRadius: 4, color: "#fff", fontSize: 11, cursor: "pointer", opacity: addingTask ? 0.5 : 1 }}
                  >
                    {addingTask ? "…" : "+ Add"}
                  </button>
                </div>
              </div>

              {/* Task list */}
              {loadingAutomation && (
                <div style={{ padding: 12, fontSize: 11, color: "var(--text3)", textAlign: "center" }}>Loading…</div>
              )}
              {!loadingAutomation && automationTasks.length === 0 && (
                <div style={{ padding: 12, fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                  No tasks yet. Any agent can POST to /api/brain/automate to schedule work.
                </div>
              )}
              {automationTasks.map((task) => (
                <div key={task.id} style={{ borderBottom: "1px solid var(--border)", padding: "8px 12px", opacity: task.enabled ? 1 : 0.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: task.enabled ? "var(--green)" : "var(--text3)" }}>
                      {task.enabled ? "●" : "○"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text)", flex: 1 }}>{task.name}</span>
                    <span style={{ fontSize: 9, color: "var(--text3)", background: "var(--bg3)", padding: "1px 5px", borderRadius: 3 }}>
                      {task.schedule}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "monospace", marginTop: 3, marginLeft: 16 }}>
                    {task.command.slice(0, 60)}{task.command.length > 60 ? "…" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, marginLeft: 16 }}>
                    <span style={{ fontSize: 9, color: "var(--text3)" }}>by {task.createdBy}</span>
                    {task.lastRun && <span style={{ fontSize: 9, color: "var(--text3)" }}>· ran {task.lastRun.slice(0, 10)}</span>}
                    <button onClick={() => toggleTask(task.id, task.enabled)} style={{ marginLeft: "auto", fontSize: 9, background: "none", border: "1px solid var(--border)", borderRadius: 3, color: "var(--text3)", cursor: "pointer", padding: "1px 5px" }}>
                      {task.enabled ? "pause" : "resume"}
                    </button>
                    <button onClick={() => deleteTask(task.id)} style={{ fontSize: 9, background: "none", border: "1px solid rgba(255,80,80,0.4)", borderRadius: 3, color: "rgba(255,100,100,0.8)", cursor: "pointer", padding: "1px 5px" }}>
                      del
                    </button>
                  </div>
                </div>
              ))}

              {/* Agent access info */}
              <div style={{ margin: 10, padding: 8, background: "var(--bg2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--accent)", marginBottom: 4 }}>🧠 Agent Access</div>
                <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.6 }}>
                  Any AI agent (Claude, Qwen, OpenClaw…) can call:
                </div>
                <div style={{ fontSize: 10, color: "var(--green)", fontFamily: "monospace", marginTop: 4, lineHeight: 1.8 }}>
                  GET /api/brain → system status<br />
                  POST /api/brain/automate → create task<br />
                  GET /api/brain/automate → list tasks
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
