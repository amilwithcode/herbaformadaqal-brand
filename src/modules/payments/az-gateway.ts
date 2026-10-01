import type {
  PaymentGateway,
  PaymentIntentInput,
  PaymentIntentResult,
} from "./gateway";
import { createHmac, timingSafeEqual } from "crypto";

const AZ_GATEWAY_BASE = process.env.PAYMENT_API_BASE_URL || "";

function safeEncode(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function computeHmacSignature(
  payload: string,
  secret: string
): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function verifyHmacSignature(
  payload: string,
  providedSignature: string,
  secret: string
): boolean {
  try {
    if (!payload || !providedSignature || !secret) return false;
    const expected = safeEncode(computeHmacSignature(payload, secret));
    const actual = safeEncode(providedSignature);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

async function callGateway(input: PaymentIntentInput) {
  if (!AZ_GATEWAY_BASE || !process.env.PAYMENT_API_KEY) {
    throw new Error("Payment provider not configured");
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    throw new Error("Invalid amount");
  }
  const currency = String(input.currency || "AZN").toUpperCase().slice(0, 8);
  const orderId = String(input.orderId).slice(0, 128);

  const res = await fetch(`${AZ_GATEWAY_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYMENT_API_KEY}`,
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      order_id: orderId,
      return_url: process.env.PAYMENT_RETURN_URL,
      webhook_url: process.env.PAYMENT_WEBHOOK_URL,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error("Payment provider error");
  }
  return res.json();
}

export const azGateway: PaymentGateway = {
  async createPaymentIntent(
    input: PaymentIntentInput
  ): Promise<PaymentIntentResult> {
    const data = await callGateway(input);
    return {
      redirectUrl: data.redirect_url,
      providerReference: data.reference,
    };
  },
  verifySignature(payload: string, signature: string) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || "";
    if (!secret) return false;
    if (verifyHmacSignature(payload, signature, secret)) return true;
    try {
      if (!payload || payload.length === 0) return false;
      const expected = safeEncode(secret);
      const actual = safeEncode(signature);
      if (expected.length !== actual.length) return false;
      return timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  },
};

