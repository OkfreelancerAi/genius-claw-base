import { NextResponse } from "next/server";
import { runCrawlCycle } from "@/lib/research/pipeline";
import { listFindings, listJournal } from "@/lib/research/store";

export async function POST() {
  try {
    const produced = await runCrawlCycle();
    return NextResponse.json({
      ok: true,
      produced: produced.length,
      pending: listFindings({ status: "pending_approval" }).length,
      findings: produced.map((f) => ({
        id: f.id,
        title: f.title,
        status: f.status,
        scores: f.scores,
      })),
      journalTail: listJournal(8),
    });
  } catch (e) {
    return NextResponse.json({ error: "Crawl failed", detail: String(e) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  return NextResponse.json({
    findings: listFindings(status ? { status } : undefined),
    journal: listJournal(30),
  });
}
