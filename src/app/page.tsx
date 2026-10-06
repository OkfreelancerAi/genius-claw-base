"use client";

import { useCallback, useEffect, useState } from "react";

const OWNER = "0xF4BAaf1D85753A857Aa9C4AeBa877D7864bE48aA";
const SHORT_OWNER = `${OWNER.slice(0, 6)}…${OWNER.slice(-4)}`;

type Tab = "home" | "launch" | "research" | "payouts";

export default function MobileDapp() {
  const [tab, setTab] = useState<Tab>("home");
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      alert("Install MetaMask or open in a wallet browser");
      return;
    }
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    setAddress(accounts[0] ?? null);
  }, []);

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto bg-background text-foreground">
      <header className="px-4 pt-4 pb-2 border-b border-card-border flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold">Genius Claw</p>
          <p className="text-[10px] text-muted">Base · ClawPump · Research</p>
        </div>
        <button onClick={connect} className="text-xs px-3 py-1.5 rounded-full border border-card-border">
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect"}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {tab === "home" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-card border border-card-border p-4">
              <p className="text-xs text-muted uppercase">Ownership Locked · Base</p>
              <p className="font-mono text-sm text-accent mt-1">{SHORT_OWNER}</p>
              <p className="text-xs text-muted mt-2">@okfreelancer · @badman666</p>
            </div>
            <p className="text-xs text-muted text-center">Use Intel tab to run research crawl. Launch needs CLAWPUMP_API_KEY.</p>
          </div>
        )}
        {tab === "launch" && <LaunchForm />}
        {tab === "research" && <ResearchPanel />}
        {tab === "payouts" && <PayoutPanel />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-card-border bg-background/95">
        <div className="max-w-md mx-auto grid grid-cols-4 h-14">
          {(["home", "launch", "research", "payouts"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-[10px] capitalize ${tab === t ? "text-accent" : "text-muted"}`}>
              {t === "research" ? "Intel" : t}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LaunchForm() {
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function launch() {
    setLoading(true);
    setOut("");
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, name, symbol: symbol.toUpperCase(), selfFunded: true, initialBuySol: 0 }),
      });
      const data = await res.json();
      setOut(JSON.stringify(data, null, 2).slice(0, 500));
    } catch (e) {
      setOut(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Launch Token</h2>
      <input className="w-full h-11 rounded-xl bg-card border border-card-border px-3 text-sm" placeholder="Agent ID" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
      <input className="w-full h-11 rounded-xl bg-card border border-card-border px-3 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full h-11 rounded-xl bg-card border border-card-border px-3 text-sm" placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      <button disabled={loading || !agentId || !name || !symbol} onClick={launch} className="w-full h-12 rounded-xl bg-accent text-black font-semibold text-sm disabled:opacity-40">
        {loading ? "Launching…" : "Launch on ClawPump"}
      </button>
      {out && <pre className="text-[11px] whitespace-pre-wrap bg-card border border-card-border rounded-xl p-3">{out}</pre>}
    </div>
  );
}

function ResearchPanel() {
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<Array<{ id: string; title: string; status: string }>>([]);

  async function crawl() {
    const res = await fetch("/api/research/crawl", { method: "POST" });
    const data = await res.json();
    setMsg(`Produced ${data.produced ?? 0}, pending ${data.pending ?? 0}`);
    const list = await fetch("/api/research/crawl?status=pending_approval").then((r) => r.json());
    setPending(list.findings || []);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Research Intel</h2>
        <button onClick={crawl} className="h-9 px-3 rounded-xl bg-accent text-black text-xs font-semibold">Crawl</button>
      </div>
      <p className="text-xs text-muted">Crawler → SCOUT → SKEPTIC → QUANT → you</p>
      {msg && <p className="text-xs text-success">{msg}</p>}
      {pending.map((f) => (
        <div key={f.id} className="rounded-xl border border-card-border bg-card p-3 text-sm">{f.title}</div>
      ))}
    </div>
  );
}

function PayoutPanel() {
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [out, setOut] = useState("");

  async function send() {
    const res = await fetch("/api/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, destinationId: dest }),
    });
    setOut(JSON.stringify(await res.json(), null, 2).slice(0, 400));
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Circle Payouts</h2>
      <input className="w-full h-11 rounded-xl bg-card border border-card-border px-3 text-sm" placeholder="Amount USD" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input className="w-full h-11 rounded-xl bg-card border border-card-border px-3 text-sm" placeholder="Address book ID" value={dest} onChange={(e) => setDest(e.target.value)} />
      <button onClick={send} className="w-full h-12 rounded-xl bg-accent text-black font-semibold text-sm">Send USDC</button>
      {out && <pre className="text-[11px] whitespace-pre-wrap bg-card border border-card-border rounded-xl p-3">{out}</pre>}
    </div>
  );
}
