import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { invoiceCopy, invoiceSellerInfo } from "@/lib/copy/invoice";
import { formatKurus } from "@/lib/money";
import type { ShippingAddress } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";

// Invoice PDF (R15): invoice-styled document generated on demand from the
// order's immutable snapshots — never stored, so a re-download always
// reproduces the same document. NOT a registered e-Arşiv fatura (the owner
// issues that via GİB); the footer note says so.

export type InvoiceLine = {
  name: string;
  quantity: number;
  unitNetCents: number;
  netCents: number;
};

export type InvoiceData = {
  orderNumber: string;
  invoiceDate: Date;
  paymentProvider: string | null;
  kdvRatePercent: number;
  buyerName: string;
  buyerAddressLines: string[];
  buyerEmail: string;
  lines: InvoiceLine[];
  netTotalCents: number;
  kdvTotalCents: number;
  grossTotalCents: number;
};

// Prices are KDV-inclusive (R3): net = gross / (1 + rate). Per-line rounding,
// with the footer KDV derived as gross − Σnets so the totals always reconcile
// to the amount actually charged.
function netOf(grossCents: number, ratePercent: number): number {
  return Math.round((grossCents * 100) / (100 + ratePercent));
}

// Invoices exist only for orders whose payment is verified.
const INVOICEABLE = ["PAID", "FULFILLED"] as const;

export async function loadInvoiceData(orderId: string): Promise<InvoiceData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || !INVOICEABLE.some((status) => status === order.status)) return null;

  const address = order.shippingAddress as ShippingAddress;
  const rate = order.kdvRatePercent;

  const lines: InvoiceLine[] = order.items.map((item) => ({
    name: item.variantLabelSnapshot
      ? `${item.productNameSnapshot} (${item.variantLabelSnapshot})`
      : item.productNameSnapshot,
    quantity: item.quantity,
    unitNetCents: netOf(item.unitPriceCents, rate),
    netCents: netOf(item.lineTotalCents, rate),
  }));
  if (order.shippingCents > 0) {
    lines.push({
      name: invoiceCopy.shippingItem,
      quantity: 1,
      unitNetCents: netOf(order.shippingCents, rate),
      netCents: netOf(order.shippingCents, rate),
    });
  }

  const netTotalCents = lines.reduce((sum, line) => sum + line.netCents, 0);

  return {
    orderNumber: order.orderNumber,
    invoiceDate: order.paidAt ?? order.placedAt,
    paymentProvider: order.paymentProvider,
    kdvRatePercent: rate,
    buyerName: address.fullName,
    buyerAddressLines: [
      address.address,
      `${address.district}, ${address.city}${address.postalCode ? ` ${address.postalCode}` : ""}`,
    ],
    buyerEmail: order.email,
    lines,
    netTotalCents,
    kdvTotalCents: order.totalCents - netTotalCents,
    grossTotalCents: order.totalCents,
  };
}

// Built-in PDF fonts cannot encode ğ/ş/İ — Inter TTFs are embedded instead
// (src/assets/fonts, traced into standalone via outputFileTracingIncludes).
let fontsPromise: Promise<{ regular: Buffer; semibold: Buffer }> | null = null;

function loadFonts() {
  fontsPromise ??= (async () => {
    const dir = path.join(process.cwd(), "src", "assets", "fonts");
    const [regular, semibold] = await Promise.all([
      readFile(path.join(dir, "Inter-Regular.ttf")),
      readFile(path.join(dir, "Inter-SemiBold.ttf")),
    ]);
    return { regular, semibold };
  })();
  // A cached rejection would poison every later invoice; retry next call.
  fontsPromise.catch(() => {
    fontsPromise = null;
  });
  return fontsPromise;
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeZone: "Europe/Istanbul",
});

const PAGE = { width: 595.28, height: 841.89, margin: 50 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
// Item description, quantity, net unit price, KDV rate, net line total.
const COLUMNS = [235, 50, 85, 40, 85] as const;
const ROW_GAP = 6;

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const fonts = await loadFonts();
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    info: { Title: `${invoiceCopy.documentTitle} ${data.orderNumber}`, Author: "MofuTenshi" },
  });
  doc.registerFont("body", fonts.regular);
  doc.registerFont("bold", fonts.semibold);

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;

  // Header: title left, document meta right.
  doc.font("bold").fontSize(22).text(invoiceCopy.documentTitle, left, PAGE.margin);
  doc
    .font("body")
    .fontSize(10)
    .fillColor("#555555")
    .text("MofuTenshi", left, doc.y + 2);
  doc.fillColor("#000000");

  const meta: Array<[string, string]> = [
    [invoiceCopy.invoiceNumberLabel, data.orderNumber],
    [invoiceCopy.invoiceDateLabel, dateFormatter.format(data.invoiceDate)],
    [invoiceCopy.orderNumberLabel, data.orderNumber],
    [
      invoiceCopy.paymentMethodLabel,
      invoiceCopy.paymentMethods[data.paymentProvider ?? ""] ?? invoiceCopy.paymentMethods.card,
    ],
  ];
  let metaY = PAGE.margin;
  for (const [label, value] of meta) {
    doc
      .font("body")
      .fontSize(9)
      .text(label, right - 220, metaY, { width: 110 });
    doc
      .font("bold")
      .fontSize(9)
      .text(value, right - 105, metaY, { width: 105, align: "right" });
    metaY += 14;
  }

  // Seller and buyer blocks side by side.
  const partyY = 130;
  const partyWidth = CONTENT_WIDTH / 2 - 10;
  const sellerLines = [
    invoiceSellerInfo.name,
    ...invoiceSellerInfo.addressLines,
    `${invoiceCopy.taxOfficeLabel}: ${invoiceSellerInfo.taxOffice} / ${invoiceSellerInfo.taxNumber}`,
    `${invoiceCopy.mersisLabel}: ${invoiceSellerInfo.mersisNo}`,
    `${invoiceCopy.emailLabel}: ${invoiceSellerInfo.email}`,
    `${invoiceCopy.phoneLabel}: ${invoiceSellerInfo.phone}`,
  ];
  const buyerLines = [data.buyerName, ...data.buyerAddressLines, data.buyerEmail];

  doc.font("bold").fontSize(10).text(invoiceCopy.sellerHeading, left, partyY);
  doc
    .font("body")
    .fontSize(9)
    .text(sellerLines.join("\n"), left, partyY + 16, {
      width: partyWidth,
      lineGap: 2,
    });
  const sellerBottom = doc.y;
  doc
    .font("bold")
    .fontSize(10)
    .text(invoiceCopy.buyerHeading, left + partyWidth + 20, partyY);
  doc
    .font("body")
    .fontSize(9)
    .text(buyerLines.join("\n"), left + partyWidth + 20, partyY + 16, {
      width: partyWidth,
      lineGap: 2,
    });
  let y = Math.max(sellerBottom, doc.y) + 24;

  const columnX = COLUMNS.reduce<number[]>((xs, width) => {
    xs.push((xs.at(-1) ?? left) + width);
    return xs;
  }, []);
  const cellX = (index: number) => (index === 0 ? left : columnX[index - 1]);

  const headerLabels = [
    invoiceCopy.columns.item,
    invoiceCopy.columns.quantity,
    invoiceCopy.columns.unitPrice,
    invoiceCopy.columns.kdvRate,
    invoiceCopy.columns.lineTotal,
  ];

  function drawTableHeader() {
    doc.font("bold").fontSize(8).fillColor("#555555");
    headerLabels.forEach((label, i) => {
      doc.text(label.toLocaleUpperCase("tr-TR"), cellX(i), y, {
        width: COLUMNS[i],
        align: i === 0 ? "left" : "right",
      });
    });
    doc.fillColor("#000000");
    y += 14;
    doc
      .moveTo(left, y - 2)
      .lineTo(right, y - 2)
      .lineWidth(0.5)
      .strokeColor("#999999")
      .stroke();
    y += ROW_GAP;
  }

  drawTableHeader();

  const footerReserve = 170;
  for (const line of data.lines) {
    doc.font("body").fontSize(9);
    const nameHeight = doc.heightOfString(line.name, { width: COLUMNS[0] });
    const rowHeight = Math.max(nameHeight, 11);
    if (y + rowHeight > PAGE.height - PAGE.margin - footerReserve) {
      doc.addPage();
      y = PAGE.margin;
      drawTableHeader();
    }
    const cells = [
      line.name,
      String(line.quantity),
      formatKurus(line.unitNetCents),
      `%${data.kdvRatePercent}`,
      formatKurus(line.netCents),
    ];
    cells.forEach((value, i) => {
      doc.text(value, cellX(i), y, { width: COLUMNS[i], align: i === 0 ? "left" : "right" });
    });
    y += rowHeight + ROW_GAP;
    doc
      .moveTo(left, y - 4)
      .lineTo(right, y - 4)
      .lineWidth(0.25)
      .strokeColor("#dddddd")
      .stroke();
  }

  // Totals block, right-aligned under the table.
  y += 10;
  const totals: Array<[string, string, boolean]> = [
    [invoiceCopy.netTotalLabel, formatKurus(data.netTotalCents), false],
    [invoiceCopy.kdvTotalLabel(data.kdvRatePercent), formatKurus(data.kdvTotalCents), false],
    [invoiceCopy.grossTotalLabel, formatKurus(data.grossTotalCents), false],
    [invoiceCopy.payableLabel, formatKurus(data.grossTotalCents), true],
  ];
  for (const [label, value, emphasized] of totals) {
    doc.font(emphasized ? "bold" : "body").fontSize(emphasized ? 10 : 9);
    doc.text(label, right - 300, y, { width: 190 });
    doc.text(value, right - 105, y, { width: 105, align: "right" });
    y += emphasized ? 18 : 15;
  }

  // Footer note pinned to the bottom margin of the final page.
  doc
    .font("body")
    .fontSize(7.5)
    .fillColor("#777777")
    .text(invoiceCopy.legalNote, left, PAGE.height - PAGE.margin - 24, {
      width: CONTENT_WIDTH,
    });

  doc.end();
  return finished;
}
