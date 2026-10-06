import { NextRequest, NextResponse } from "next/server";
import { getFinding, upsertFinding, addJournal } from "@/lib/research/store";
import type { ActionType } from "@/lib/research/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { findingId, decision, action, approvedBy } = body as {
      findingId: string;
      decision: "approve" | "reject";
      action?: ActionType;
      approvedBy?: string;
    };
    if (!findingId || !decision) {
      return NextResponse.json({ error: "findingId and decision required" }, { status: 422 });
    }
    const f = getFinding(findingId);
    if (!f) return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    if (f.status !== "pending_approval") {
      return NextResponse.json({ error: `Cannot review status=${f.status}` }, { status: 400 });
    }
    if (decision === "reject") {
      f.status = "rejected";
      f.approvedBy = approvedBy || "human";
      f.approvedAt = new Date().toISOString();
      upsertFinding(f);
      addJournal({ findingId: f.id, event: "rejected", detail: "Rejected", agent: "human" });
      return NextResponse.json({ ok: true, finding: f });
    }
    f.status = action ? "acted" : "approved";
    f.approvedBy = approvedBy || "human";
    f.approvedAt = new Date().toISOString();
    f.action = action;
    if (action) {
      f.actionResult = `${action} queued for ${f.title.slice(0, 60)}`;
      addJournal({ findingId: f.id, event: "acted", detail: f.actionResult, agent: "action" });
    } else {
      addJournal({ findingId: f.id, event: "approved", detail: "Approved", agent: "human" });
    }
    upsertFinding(f);
    return NextResponse.json({ ok: true, finding: f });
  } catch (e) {
    return NextResponse.json({ error: "Approve failed", detail: String(e) }, { status: 500 });
  }
}
