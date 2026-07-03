import Iyzipay from "iyzipay";
import type {
  PaymentGateway,
  PaymentInitResult,
  PaymentOrder,
  PaymentVerification,
} from "@/lib/payments/types";

// iyzico hosted CheckoutForm flow (PRD §12): the buyer pays on iyzico's page,
// no card data ever touches this server. The browser returns via callbackUrl
// and the result is verified server-to-server with checkoutForm.retrieve —
// the callback POST alone is never trusted.

const apiKey = process.env.IYZICO_API_KEY;
const secretKey = process.env.IYZICO_SECRET_KEY;
const baseUrl = process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com";

export const iyzicoConfigured = Boolean(apiKey && secretKey);

function client(): Iyzipay {
  if (!iyzicoConfigured) throw new Error("iyzico is not configured");
  return new Iyzipay({ apiKey: apiKey!, secretKey: secretKey!, uri: baseUrl });
}

// Integer-only kuruş → "24.65" at the API boundary (CLAUDE.md money rule).
function kurusToDecimal(cents: number): string {
  return `${Math.floor(cents / 100)}.${(cents % 100).toString().padStart(2, "0")}`;
}

function decimalToKurus(value: string): number {
  const [lira, kurus = ""] = value.split(".");
  return Number(lira) * 100 + Number(kurus.padEnd(2, "0").slice(0, 2));
}

function splitName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1] };
}

export const iyzicoGateway: PaymentGateway = {
  id: "iyzico",

  async initPayment(order: PaymentOrder, callbackUrl: string): Promise<PaymentInitResult> {
    const { name, surname } = splitName(order.shippingAddress.fullName);
    const address = {
      contactName: order.shippingAddress.fullName,
      city: order.shippingAddress.city,
      country: "Turkey",
      address: `${order.shippingAddress.address}, ${order.shippingAddress.district}`,
      zipCode: order.shippingAddress.postalCode,
    };

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: order.id,
      price: kurusToDecimal(order.subtotalCents),
      paidPrice: kurusToDecimal(order.totalCents),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: order.id,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      buyer: {
        id: order.id,
        name,
        surname,
        gsmNumber: order.shippingAddress.phone,
        email: order.email,
        // TCKN is not collected in v1; iyzico requires the field to be present.
        identityNumber: "11111111111",
        registrationAddress: address.address,
        ip: order.buyerIp,
        city: address.city,
        country: address.country,
        zipCode: address.zipCode,
      },
      shippingAddress: address,
      billingAddress: address,
      basketItems: order.items.map((item) => ({
        id: item.variantId,
        name: item.name,
        category1: "Urun",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: kurusToDecimal(item.lineCents),
      })),
    };

    const result = await new Promise<Iyzipay.CheckoutFormInitializeResult>((resolve, reject) => {
      client().checkoutFormInitialize.create(request, (err, res) =>
        err ? reject(err) : resolve(res),
      );
    });

    if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
      console.error("iyzico init failed", result.errorCode, result.errorMessage);
      return { ok: false };
    }
    return { ok: true, redirectUrl: result.paymentPageUrl, paymentRef: result.token };
  },

  async verifyCallback(params: Record<string, string>): Promise<PaymentVerification> {
    const token = params.token;
    if (!token) return { ok: false, orderId: null };

    const result = await new Promise<Iyzipay.CheckoutFormRetrieveResult>((resolve, reject) => {
      client().checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, (err, res) =>
        err ? reject(err) : resolve(res),
      );
    });

    const orderId = typeof result.conversationId === "string" ? result.conversationId : null;
    if (result.status !== "success" || result.paymentStatus !== "SUCCESS" || !orderId) {
      return { ok: false, orderId };
    }
    return {
      ok: true,
      orderId,
      paymentRef: String(result.paymentId),
      paidCents: decimalToKurus(String(result.paidPrice)),
    };
  },
};
