import { checkoutCopy } from "@/lib/copy/checkout";
import { formatKurus } from "@/lib/money";

export type SummaryLine = {
  key: string;
  name: string;
  label: string | null;
  quantity: number;
  lineCents: number;
};

export function OrderSummary({
  lines,
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
}: {
  lines: SummaryLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}) {
  return (
    <div className="border-border rounded-lg border p-6">
      <h2 className="font-display text-xl">{checkoutCopy.summaryHeading}</h2>
      <ul className="divide-border mt-4 divide-y">
        {lines.map((line) => (
          <li key={line.key} className="flex items-baseline justify-between gap-3 py-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium">{line.name}</span>
              {line.label && <span className="text-muted block">{line.label}</span>}
              <span className="text-muted block">× {line.quantity}</span>
            </span>
            <span className="whitespace-nowrap">{formatKurus(line.lineCents)}</span>
          </li>
        ))}
      </ul>
      <dl className="border-border mt-2 flex flex-col gap-1 border-t pt-4 text-sm">
        {/* Subtotal shows pre-sale prices so the discount row visibly subtracts. */}
        <div className="flex justify-between">
          <dt>{checkoutCopy.subtotal}</dt>
          <dd>{formatKurus(subtotalCents + discountCents)}</dd>
        </div>
        {discountCents > 0 && (
          <div className="text-muted flex justify-between">
            <dt>{checkoutCopy.discount}</dt>
            <dd>−{formatKurus(discountCents)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>{checkoutCopy.shipping}</dt>
          <dd>{shippingCents === 0 ? checkoutCopy.shippingFree : formatKurus(shippingCents)}</dd>
        </div>
        <div className="mt-1 flex justify-between text-base font-semibold">
          <dt>{checkoutCopy.total}</dt>
          <dd>{formatKurus(totalCents)}</dd>
        </div>
      </dl>
      <p className="text-muted mt-3 text-xs">{checkoutCopy.kdvNote}</p>
    </div>
  );
}
