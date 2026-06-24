// ═══════════════════════════════════════════════════════════════
// Tool / Skill Registry
// Agents discover and call these tools during debates
// ═══════════════════════════════════════════════════════════════

import { ToolDefinition } from "./types";

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: "web_search",
    name: "Web Search",
    description:
      "Search the web for current information, facts, data, and recent developments on any topic. Returns titles, URLs, and snippets.",
    category: "search",
    icon: "🔍",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query string",
        required: true,
      },
      {
        name: "maxResults",
        type: "number",
        description: "Max results to return (1-10)",
        required: false,
      },
    ],
  },
  {
    id: "web_fetch",
    name: "Fetch Web Page",
    description:
      "Fetch and extract readable content from a URL. Returns cleaned text, title, and metadata.",
    category: "web",
    icon: "🌐",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "HTTP or HTTPS URL to fetch",
        required: true,
      },
    ],
  },
  {
    id: "code_exec",
    name: "Code Sandbox",
    description:
      "Execute Python or JavaScript code in a sandboxed environment. Returns stdout, stderr, and execution time.",
    category: "code",
    icon: "⚡",
    parameters: [
      {
        name: "code",
        type: "string",
        description: "Code to execute",
        required: true,
      },
      {
        name: "language",
        type: "string",
        description: "python or javascript",
        required: true,
      },
    ],
  },
  {
    id: "file_read",
    name: "Read File",
    description: "Read the contents of a text file from the workspace.",
    category: "file",
    icon: "📄",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "File path relative to workspace root",
        required: true,
      },
    ],
  },
  {
    id: "file_write",
    name: "Write File",
    description:
      "Write or overwrite a text file in the workspace. Creates directories as needed.",
    category: "file",
    icon: "✏️",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "File path relative to workspace root",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "Text content to write",
        required: true,
      },
    ],
  },
  {
    id: "file_list",
    name: "List Files",
    description: "List files and directories in a given path.",
    category: "file",
    icon: "📁",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Directory path (default: workspace root)",
        required: false,
      },
    ],
  },
  {
    id: "docx_gen",
    name: "Generate Document",
    description:
      "Generate a .docx Word document from structured content (headings, paragraphs, lists).",
    category: "document",
    icon: "📝",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Document title",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "Document body (markdown supported)",
        required: true,
      },
      {
        name: "filename",
        type: "string",
        description: "Output filename (without extension)",
        required: true,
      },
    ],
  },
  {
    id: "xlsx_gen",
    name: "Generate Spreadsheet",
    description:
      "Generate a .xlsx spreadsheet from structured data (rows, columns, sheets).",
    category: "document",
    icon: "📊",
    parameters: [
      {
        name: "sheets",
        type: "string",
        description: "JSON array of sheet objects with name and rows fields",
        required: true,
      },
      {
        name: "filename",
        type: "string",
        description: "Output filename (without extension)",
        required: true,
      },
    ],
  },
  {
    id: "pptx_gen",
    name: "Generate Presentation",
    description:
      "Generate a .pptx presentation from slide data (title, bullets, notes).",
    category: "document",
    icon: "📽️",
    parameters: [
      {
        name: "slides",
        type: "string",
        description: "JSON array of slide objects with title, bullets, notes fields",
        required: true,
      },
      {
        name: "filename",
        type: "string",
        description: "Output filename (without extension)",
        required: true,
      },
    ],
  },
  {
    id: "image_gen",
    name: "Generate Image",
    description:
      "Generate an image from a text description using an AI image model.",
    category: "media",
    icon: "🎨",
    parameters: [
      {
        name: "prompt",
        type: "string",
        description: "Image description / prompt",
        required: true,
      },
      {
        name: "style",
        type: "string",
        description: "Style hint: photorealistic, illustration, diagram, etc.",
        required: false,
      },
    ],
  },
  {
    id: "pdf_gen",
    name: "Generate PDF",
    description:
      "Generate a PDF from HTML or markdown content. Supports styles, tables, and images.",
    category: "document",
    icon: "📕",
    parameters: [
      {
        name: "content",
        type: "string",
        description: "HTML or markdown content",
        required: true,
      },
      {
        name: "filename",
        type: "string",
        description: "Output filename (without extension)",
        required: true,
      },
    ],
  },
  {
    id: "data_query",
    name: "Query Data",
    description:
      "Run a SQL or structured query against the debate session database (agents, messages, ideas).",
    category: "data",
    icon: "🗄️",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "SQL query or data question in natural language",
        required: true,
      },
    ],
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}

export function getToolsByCategory(
  category: ToolDefinition["category"]
): ToolDefinition[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

export function getToolsByIds(ids: string[]): ToolDefinition[] {
  return ids.map((id) => getToolById(id)).filter(Boolean) as ToolDefinition[];
}
