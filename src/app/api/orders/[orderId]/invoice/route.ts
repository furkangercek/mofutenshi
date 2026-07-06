import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { invoiceCopy } from "@/lib/copy/invoice";
import { generateInvoicePdf, loadInvoiceData } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

// Invoice download (R15). Server-side authorization: the order's owner or an
// admin — guests receive the PDF as an email attachment instead, so this
// route never needs a token gate. 404 on everything unauthorized so the
// order-id space stays unprobeable.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 404 });

  if (session.user.role !== "ADMIN") {
    const owned = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) return new Response(null, { status: 404 });
  }

  // null covers both a missing order and a not-yet-paid one.
  const data = await loadInvoiceData(orderId);
  if (!data) return new Response(null, { status: 404 });

  const pdf = await generateInvoicePdf(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceCopy.fileName(data.orderNumber)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
