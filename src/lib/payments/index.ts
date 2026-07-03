import { iyzicoConfigured, iyzicoGateway } from "@/lib/payments/iyzico";
import type { PaymentGateway } from "@/lib/payments/types";

// Card payment stays unavailable (checkout hides the option) until the owner
// provisions gateway credentials — the manual fallback carries orders until then.
export function getCardGateway(): PaymentGateway | null {
  return iyzicoConfigured ? iyzicoGateway : null;
}
