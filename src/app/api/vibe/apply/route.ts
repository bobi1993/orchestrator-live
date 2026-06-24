import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

const ALLOWED_ROOT = "/Users/johndoe/";

function isSafePath(p: string): boolean {
  const resolved = path.resolve(p);
  return resolved.startsWith(ALLOWED_ROOT) || resolved === "/Users/johndoe";
}

// POST /api/vibe/apply
// body: { filePath: string, newContent: string }
// → writes newContent to filePath, returns { success: true, path }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, newContent, code } = body;
    const content = newContent ?? code;

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: "Missing filePath or newContent" }, { status: 400 });
    }

    if (!isSafePath(filePath)) {
      return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
    }

    await writeFile(filePath, content, "utf-8");
    return NextResponse.json({ success: true, path: filePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to apply changes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
