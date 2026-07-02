import { formatKurus } from "@/lib/money";
import { productCopy } from "@/lib/copy/catalog";

export function Price({
  priceCents,
  originalCents,
  onSale,
  className = "",
}: {
  priceCents: number;
  originalCents: number;
  onSale: boolean;
  className?: string;
}) {
  if (!onSale) {
    return <span className={`font-semibold ${className}`}>{formatKurus(priceCents)}</span>;
  }
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <s className="text-muted">{formatKurus(originalCents)}</s>
      <span className="font-semibold">{formatKurus(priceCents)}</span>
    </span>
  );
}

export function SaleBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`bg-sale text-ink rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {productCopy.saleBadge}
    </span>
  );
}
