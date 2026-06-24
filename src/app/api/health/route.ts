import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "orchestrator", version: "1.0.0", uptime: process.uptime() });
}
