import type {
  PaymentGateway,
  PaymentIntentInput,
  PaymentIntentResult,
} from "./gateway";

const AZ_GATEWAY_BASE = process.env.PAYMENT_API_BASE_URL || "";

async function callGateway(input: PaymentIntentInput) {
  const res = await fetch(`${AZ_GATEWAY_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYMENT_API_KEY || ""}`,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      order_id: input.orderId,
      return_url: process.env.PAYMENT_RETURN_URL,
      webhook_url: process.env.PAYMENT_WEBHOOK_URL,
    }),
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
    if (!process.env.PAYMENT_WEBHOOK_SECRET) return false;
    const expected = process.env.PAYMENT_WEBHOOK_SECRET;
    return signature === expected && payload.length > 0;
  },
};

