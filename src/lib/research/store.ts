import type { Finding, JournalEntry, CrawlTarget } from "./types";

const g = globalThis as unknown as {
  __gcFindings?: Finding[];
  __gcJournal?: JournalEntry[];
  __gcTargets?: CrawlTarget[];
};

if (!g.__gcFindings) g.__gcFindings = [];
if (!g.__gcJournal) g.__gcJournal = [];
if (!g.__gcTargets) {
  g.__gcTargets = [
    { type: "rss", value: "https://clawpump.tech/feed", label: "ClawPump" },
    { type: "url", value: "https://docs.base.org", label: "Base docs" },
    { type: "x", value: "ClawPump OR pump.fun", label: "X intel" },
    { type: "api", value: "https://clawpump.tech/api/v1/skills", label: "ClawPump skills" },
  ];
}

export function listFindings(filter?: { status?: string }) {
  let items = [...(g.__gcFindings || [])].sort(
    (a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
  );
  if (filter?.status) items = items.filter((f) => f.status === filter.status);
  return items;
}

export function getFinding(id: string) {
  return g.__gcFindings!.find((f) => f.id === id);
}

export function upsertFinding(f: Finding) {
  const i = g.__gcFindings!.findIndex((x) => x.id === f.id);
  if (i >= 0) g.__gcFindings![i] = f;
  else g.__gcFindings!.push(f);
  return f;
}

export function addJournal(entry: Omit<JournalEntry, "id" | "at"> & { id?: string; at?: string }) {
  const e: JournalEntry = {
    id: entry.id || `j_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at || new Date().toISOString(),
    findingId: entry.findingId,
    event: entry.event,
    detail: entry.detail,
    agent: entry.agent,
  };
  g.__gcJournal!.unshift(e);
  return e;
}

export function listJournal(limit = 50) {
  return (g.__gcJournal || []).slice(0, limit);
}

export function listTargets() {
  return g.__gcTargets || [];
}
