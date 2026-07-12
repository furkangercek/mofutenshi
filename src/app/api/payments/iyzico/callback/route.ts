import { revalidateTag } from "next/cache";
import { after, NextResponse, type NextRequest } from "next/server";
import { clearCartAfterOrder } from "@/lib/cart-clear";
import { sendAdminNewOrderEmail, sendOrderPaidEmail } from "@/lib/order-emails";
import { markOrderPaid } from "@/lib/order-paid";
import { orderAccessToken } from "@/lib/order-token";
import { getCardGateway } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { releaseOrderReservations } from "@/lib/stock";

// iyzico redirects the buyer's browser here with a token after the hosted
// payment page. The token is only a lookup key — payment state is verified
// server-to-server in verifyCallback before anything is trusted (PRD §12).

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: NextRequest) {
  const gateway = getCardGateway();
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  if (!gateway || typeof token !== "string") return redirectTo(request, "/cart");

  let verification;
  try {
    verification = await gateway.verifyCallback({ token });
  } catch (error) {
    console.error("payment verification threw", error);
    return redirectTo(request, "/checkout?error=payment");
  }

  if (!verification.ok) {
    if (verification.orderId) {
      const cancelled = await prisma.order.updateMany({
        where: {
          id: verification.orderId,
          status: "PENDING_PAYMENT",
          paymentProvider: gateway.id,
        },
        data: { status: "CANCELLED" },
      });
      if (cancelled.count > 0) await releaseOrderReservations(verification.orderId);
    }
    return redirectTo(request, "/checkout?error=payment");
  }

  const order = await prisma.order.findUnique({
    where: { id: verification.orderId },
    select: { id: true, userId: true, totalCents: true, paymentProvider: true },
  });
  if (!order || order.paymentProvider !== gateway.id) return redirectTo(request, "/cart");

  // A verified-success callback whose amount disagrees with the order is left
  // PENDING for manual review — never marked PAID, never charged stock.
  if (order.totalCents !== verification.paidCents) {
    console.error(
      `paid amount mismatch for order ${order.id}: expected ${order.totalCents}, gateway says ${verification.paidCents}`,
    );
    return redirectTo(request, "/checkout?error=payment");
  }

  const becamePaid = await markOrderPaid(order.id, verification.paymentRef);

  if (becamePaid) {
    await clearCartAfterOrder(order.userId);
    revalidateTag("catalog", "max");
    after(() =>
      Promise.all([sendOrderPaidEmail(order.id), sendAdminNewOrderEmail(order.id, "paid")]),
    );
  }
  return redirectTo(
    request,
    `/checkout/confirmation?order=${order.id}&token=${orderAccessToken(order.id)}`,
  );
}

// Stray GET visits (bookmarks, refreshes) have nothing to verify.
export function GET(request: NextRequest) {
  return redirectTo(request, "/cart");
}
