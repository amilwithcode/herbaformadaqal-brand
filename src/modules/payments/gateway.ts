export type PaymentIntentInput = {
  amount: number;
  currency: "AZN" | "USD" | "EUR" | "TRY";
  orderId: number;
};

export type PaymentIntentResult = {
  redirectUrl: string;
  providerReference: string;
};

export interface PaymentGateway {
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifySignature(payload: string, signature: string): boolean;
}

