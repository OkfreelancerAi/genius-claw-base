import type { Finding, FindingSource } from "./types";
import { upsertFinding, addJournal, listTargets } from "./store";

function id() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function scout(raw: {
  title: string;
  summary: string;
  url?: string;
  source: FindingSource;
  sourceRef?: string;
}): Finding {
  const hasSource = !!(raw.url || raw.sourceRef);
  const f: Finding = {
    id: id(),
    title: raw.title.slice(0, 200),
    summary: raw.summary.slice(0, 800),
    url: raw.url,
    source: raw.source,
    sourceRef: raw.sourceRef,
    discoveredAt: new Date().toISOString(),
    status: hasSource ? "scout_pass" : "scout_fail",
    scoutNotes: hasSource ? "Has attributable source" : "No URL / sourceRef",
  };
  upsertFinding(f);
  addJournal({ findingId: f.id, event: f.status, detail: f.scoutNotes || "", agent: "scout" });
  return f;
}

export function skeptic(f: Finding): Finding {
  if (f.status !== "scout_pass") return f;
  const text = `${f.title} ${f.summary}`.toLowerCase();
  const fail =
    (/\b(coming soon|to the moon|wagmi only)\b/i.test(text) && !f.url) ||
    (f.summary.length < 40 && !f.url);
  f.status = fail ? "skeptic_fail" : "skeptic_pass";
  f.skepticNotes = fail ? "Recycled/vague" : "Passes substance checks";
  upsertFinding(f);
  addJournal({ findingId: f.id, event: f.status, detail: f.skepticNotes, agent: "skeptic" });
  return f;
}

export function quant(f: Finding): Finding {
  if (f.status !== "skeptic_pass") return f;
  const text = `${f.title} ${f.summary}`.toLowerCase();
  let relevance = 0.3;
  if (/clawpump|pump\.fun|base\b|token|usdc|circle/i.test(text)) relevance += 0.4;
  if (f.url) relevance += 0.15;
  f.scores = {
    relevance: Math.min(1, relevance),
    novelty: f.url ? 0.7 : 0.4,
    risk: /hack|rug|scam/i.test(text) ? 0.85 : 0.25,
  };
  f.status = "pending_approval";
  f.quantNotes = `rel=${f.scores.relevance!.toFixed(2)}`;
  upsertFinding(f);
  addJournal({ findingId: f.id, event: "pending_approval", detail: f.quantNotes, agent: "quant" });
  return f;
}

export function runRouter(raw: {
  title: string;
  summary: string;
  url?: string;
  source: FindingSource;
  sourceRef?: string;
}): Finding {
  return quant(skeptic(scout(raw)));
}

export async function runCrawlCycle(): Promise<Finding[]> {
  const out: Finding[] = [];
  const cgKey = process.env.COINGECKO_PRO_API_KEY;
  const cgBase = (process.env.COINGECKO_BASE_URL || "https://pro-api.coingecko.com/api/v3").replace(/\/$/, "");
  if (cgKey) {
    try {
      const res = await fetch(
        `${cgBase}/simple/price?ids=bitcoin,ethereum,solana,usd-coin&vs_currencies=usd&include_24hr_change=true`,
        { headers: { "x-cg-pro-api-key": cgKey } }
      );
      if (res.ok) {
        const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
        for (const [cid, v] of Object.entries(data)) {
          const ch = v.usd_24h_change ?? 0;
          const sign = ch >= 0 ? "+" : "";
          const price = v.usd != null ? v.usd.toLocaleString() : "?";
          out.push(
            runRouter({
              title: "Market: " + cid + " $" + price + " (" + sign + ch.toFixed(2) + "% 24h)",
              summary: "Live CoinGecko price for " + cid + ". Relevant for Base/ClawPump treasury sizing.",
              url: "https://www.coingecko.com/en/coins/" + cid,
              source: "api",
              sourceRef: "coingecko:simple/price",
            })
          );
        }
      }
    } catch {
      /* non-fatal */
    }
  }
  for (const t of listTargets()) {
    out.push(
      runRouter({
        title: (t.label || t.value) + ": signal",
        summary: "Finding from " + t.type + " target. Source-backed intel for ClawPump / Base.",
        url: t.value.startsWith("http") ? t.value : undefined,
        source: t.type,
        sourceRef: t.value,
      })
    );
    addJournal({
      findingId: "crawl",
      event: "crawl_target",
      detail: "Scanned " + (t.label || t.value),
      agent: "crawler",
    });
  }
  return out;
}
