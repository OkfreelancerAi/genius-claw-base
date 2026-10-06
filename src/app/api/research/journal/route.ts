import { NextResponse } from "next/server";
import { listJournal } from "@/lib/research/store";

export async function GET() {
  return NextResponse.json({ journal: listJournal(100) });
}
