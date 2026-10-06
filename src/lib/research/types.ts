export type FindingSource = "rss" | "url" | "api" | "x" | "blog" | "manual";
export type FindingStatus =
  | "raw" | "scout_pass" | "scout_fail" | "skeptic_pass" | "skeptic_fail"
  | "quant_scored" | "pending_approval" | "approved" | "rejected" | "acted" | "archived";
export type ActionType = "alert" | "save" | "notify" | "trade" | "launch_hint";

export interface Finding {
  id: string;
  title: string;
  summary: string;
  url?: string;
  source: FindingSource;
  sourceRef?: string;
  discoveredAt: string;
  status: FindingStatus;
  scores?: { relevance?: number; novelty?: number; risk?: number; size?: number };
  scoutNotes?: string;
  skepticNotes?: string;
  quantNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  action?: ActionType;
  actionResult?: string;
}

export interface JournalEntry {
  id: string;
  findingId: string;
  event: string;
  detail: string;
  at: string;
  agent?: "crawler" | "scout" | "skeptic" | "quant" | "human" | "action";
}

export interface CrawlTarget {
  type: FindingSource;
  value: string;
  label?: string;
}
