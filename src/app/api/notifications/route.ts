import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    notifications: store.notifications.list(),
    unreadCount: store.notifications.unreadCount(),
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    if (action === "markAllRead") {
      store.notifications.markAllRead();
    } else if (id) {
      store.notifications.markRead(id);
    }
    return NextResponse.json({ unreadCount: store.notifications.unreadCount() });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
