import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/launch
 * Proxies to ClawPump Partner API (server-side only).
 * Requires CLAWPUMP_API_KEY in env.
 */
export async function POST(req: NextRequest) {
  const key = process.env.CLAWPUMP_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "CLAWPUMP_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const res = await fetch("https://clawpump.tech/api/v1/launch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Launch proxy failed", detail: String(e) },
      { status: 502 }
    );
  }
}
