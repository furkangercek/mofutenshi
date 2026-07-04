import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteSaleForm, EndSaleEarlyForm, SaleForm } from "@/components/admin/sale-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminProductsCopy, adminSalesCopy } from "@/lib/copy/admin";
import { toIstanbulInputValue } from "@/lib/datetime";
import { kurusToInputValue } from "@/lib/money";
import { getAdminSale, getProductOptions, getTagCheckboxOptions } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminSalesCopy.title };

export default async function AdminEditSalePage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  await requireAdmin(`/admin/sales/${saleId}`);

  const [sale, tagOptions, productOptions] = await Promise.all([
    getAdminSale(saleId),
    getTagCheckboxOptions(adminProductsCopy.flatTagsGroup),
    getProductOptions(),
  ]);
  if (!sale) notFound();

  const now = new Date();
  const isRunning = !sale.endedEarly && sale.startsAt <= now && sale.endsAt >= now;

  return (
    <div>
      <h1 className="font-display text-3xl">{adminSalesCopy.editTitle(sale.name)}</h1>
      <div className="mt-6">
        <SaleForm
          defaults={{
            id: sale.id,
            name: sale.name,
            type: sale.type,
            value: sale.type === "PERCENT" ? String(sale.value) : kurusToInputValue(sale.value),
            startsAt: toIstanbulInputValue(sale.startsAt),
            endsAt: toIstanbulInputValue(sale.endsAt),
            productIds: sale.productIds,
            tagIds: sale.tagIds,
          }}
          tagOptions={tagOptions}
          productOptions={productOptions}
        />
      </div>
      <div className="border-border mt-10 flex flex-wrap gap-3 border-t pt-6">
        {isRunning ? <EndSaleEarlyForm id={sale.id} name={sale.name} /> : null}
        <DeleteSaleForm id={sale.id} name={sale.name} />
      </div>
    </div>
  );
}
