import { NextResponse } from "next/server";

/**
 * GET /api/market — live prices via CoinGecko Pro (+ optional Polygon)
 */
export async function GET() {
  const cgKey = process.env.COINGECKO_PRO_API_KEY;
  const cgBase =
    process.env.COINGECKO_BASE_URL || "https://pro-api.coingecko.com/api/v3";
  const polyKey = process.env.POLYGON_API_KEY;

  const result: Record<string, unknown> = {
    coingecko: null,
    polygon: null,
    keys: {
      coingecko: !!cgKey,
      polygon: !!polyKey,
      clawpump: !!process.env.CLAWPUMP_API_KEY,
      circle: !!process.env.CIRCLE_API_KEY,
    },
  };

  try {
    if (cgKey) {
      const url = `${cgBase.replace(/\/$/, "")}/simple/price?ids=bitcoin,ethereum,solana,usd-coin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
      const res = await fetch(url, {
        headers: { "x-cg-pro-api-key": cgKey },
        next: { revalidate: 30 },
      });
      result.coingecko = res.ok
        ? await res.json()
        : { error: res.status, body: await res.text().catch(() => "") };
    }
  } catch (e) {
    result.coingecko = { error: String(e) };
  }

  try {
    if (polyKey) {
      const base =
        process.env.POLYGON_API_BASE_URL || "https://api.polygon.io";
      const url = `${base.replace(/\/$/, "")}/v2/aggs/ticker/X:BTCUSD/prev?adjusted=true&apiKey=${polyKey}`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      result.polygon = res.ok
        ? await res.json()
        : { error: res.status, body: await res.text().catch(() => "") };
    }
  } catch (e) {
    result.polygon = { error: String(e) };
  }

  return NextResponse.json(result);
}
