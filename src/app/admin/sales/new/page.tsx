import type { Metadata } from "next";
import { SaleForm } from "@/components/admin/sale-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminProductsCopy, adminSalesCopy } from "@/lib/copy/admin";
import { toIstanbulInputValue } from "@/lib/datetime";
import { getProductOptions, getTagCheckboxOptions } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminSalesCopy.newTitle };

export default async function AdminNewSalePage() {
  await requireAdmin("/admin/sales/new");
  const [tagOptions, productOptions] = await Promise.all([
    getTagCheckboxOptions(adminProductsCopy.flatTagsGroup),
    getProductOptions(),
  ]);

  const now = new Date();
  const inWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div>
      <h1 className="font-display text-3xl">{adminSalesCopy.newTitle}</h1>
      <div className="mt-6">
        <SaleForm
          defaults={{
            name: "",
            type: "PERCENT",
            value: "",
            startsAt: toIstanbulInputValue(now),
            endsAt: toIstanbulInputValue(inWeek),
            productIds: [],
            tagIds: [],
          }}
          tagOptions={tagOptions}
          productOptions={productOptions}
        />
      </div>
    </div>
  );
}
