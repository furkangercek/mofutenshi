// Provider-agnostic payment boundary (PRD §11, R7): checkout talks to this
// interface only, so swapping iyzico for another gateway stays contained to
// one implementation file.

export type ShippingAddress = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
};

export type PaymentOrder = {
  id: string;
  email: string;
  buyerIp: string;
  subtotalCents: number;
  totalCents: number;
  shippingAddress: ShippingAddress;
  items: { variantId: string; name: string; quantity: number; lineCents: number }[];
};

export type PaymentInitResult =
  { ok: true; redirectUrl: string; paymentRef: string } | { ok: false };

export type PaymentVerification =
  | { ok: true; orderId: string; paymentRef: string; paidCents: number }
  | { ok: false; orderId: string | null };

export interface PaymentGateway {
  readonly id: string;
  initPayment(order: PaymentOrder, callbackUrl: string): Promise<PaymentInitResult>;
  verifyCallback(params: Record<string, string>): Promise<PaymentVerification>;
}
