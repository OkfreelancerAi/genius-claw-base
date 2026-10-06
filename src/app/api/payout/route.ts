import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payout — Circle USDC creator/user payouts
 */
export async function POST(req: NextRequest) {
  const key = process.env.CIRCLE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "CIRCLE_API_KEY not configured" },
      { status: 500 }
    );
  }

  const base =
    process.env.CIRCLE_ENV === "production"
      ? "https://api.circle.com"
      : "https://api-sandbox.circle.com";

  try {
    const body = await req.json();
    const {
      amount,
      destinationId,
      idempotencyKey,
      purposeOfTransfer = "PMT001",
    } = body as {
      amount: string;
      destinationId: string;
      idempotencyKey?: string;
      purposeOfTransfer?: string;
    };

    if (!amount || !destinationId) {
      return NextResponse.json(
        { error: "amount and destinationId required" },
        { status: 422 }
      );
    }

    const res = await fetch(`${base}/v1/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey:
          idempotencyKey ||
          `gc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        destination: { type: "address_book", id: destinationId },
        amount: { amount: String(amount), currency: "USD" },
        purposeOfTransfer,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Payout failed", detail: String(e) },
      { status: 502 }
    );
  }
}

export async function GET() {
  const key = process.env.CIRCLE_API_KEY;
  return NextResponse.json({
    configured: !!key,
    env: process.env.CIRCLE_ENV || "sandbox",
  });
}
