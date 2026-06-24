import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile, writeFile, stat } from "fs/promises";
import path from "path";

const BASE = "/Users/johndoe";
const ALLOWED_ROOT = BASE + "/";

function resolvePath(p: string): string {
  // If relative, resolve under /Users/johndoe
  return p.startsWith("/") ? p : path.join(BASE, p);
}

function isSafePath(p: string): boolean {
  const resolved = path.resolve(p);
  return resolved.startsWith(ALLOWED_ROOT) || resolved === BASE;
}

const SKIP = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".DS_Store", "coverage",
]);

// GET /api/vibe/files?path=...           → list directory (returns {files})
// GET /api/vibe/files?path=...&content=true → read file content
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path");
  const wantContent = searchParams.get("content") === "true";

  if (!rawPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const filePath = resolvePath(rawPath);

  if (!isSafePath(filePath)) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  try {
    const info = await stat(filePath);

    if (wantContent || info.isFile()) {
      const content = await readFile(filePath, "utf-8");
      return NextResponse.json({ path: filePath, content });
    }

    // Recursive directory listing (2 levels deep, skip heavy dirs)
    const files = await collectFiles(filePath, filePath, 0, 2);
    return NextResponse.json({ path: filePath, files });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read path";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function collectFiles(
  root: string,
  dir: string,
  depth: number,
  maxDepth: number
): Promise<{ name: string; path: string; type: "file" | "dir"; depth: number }[]> {
  if (depth > maxDepth) return [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results: { name: string; path: string; type: "file" | "dir"; depth: number }[] = [];
  for (const e of entries) {
    if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push({ name: e.name, path: full, type: "dir", depth });
      const children = await collectFiles(root, full, depth + 1, maxDepth);
      results.push(...children);
    } else {
      results.push({ name: e.name, path: full, type: "file", depth });
    }
  }
  return results;
}

// POST /api/vibe/files  body: { path, content } → write file
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPath = body.path;
    const content = body.content;

    if (!rawPath || content === undefined) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 });
    }

    const filePath = resolvePath(rawPath);
    if (!isSafePath(filePath)) {
      return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
    }

    await writeFile(filePath, content, "utf-8");
    return NextResponse.json({ success: true, path: filePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to write file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
