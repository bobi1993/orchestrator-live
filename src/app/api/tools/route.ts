import { NextResponse } from "next/server";
import { TOOL_REGISTRY } from "@/lib/tools";

// GET /api/tools — list all available tools
export async function GET() {
  return NextResponse.json({ tools: TOOL_REGISTRY });
}
