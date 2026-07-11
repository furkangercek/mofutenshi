import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminProductsCopy } from "@/lib/copy/admin";
import { getTagCheckboxOptions } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminProductsCopy.newTitle };

export default async function AdminNewProductPage() {
  await requireAdmin("/admin/products/new");
  const tagOptions = await getTagCheckboxOptions(adminProductsCopy.flatTagsGroup);

  return (
    <div>
      <h1 className="font-display text-3xl">{adminProductsCopy.newTitle}</h1>
      <p className="text-muted mt-2 text-sm">{adminProductsCopy.imagesAfterCreate}</p>
      <div className="mt-6">
        <ProductForm
          defaults={{
            name: "",
            slug: "",
            description: "",
            status: "DRAFT",
            isFeatured: false,
            tagIds: [],
            optionTypes: [],
            variants: [
              {
                id: "",
                sku: "",
                price: "",
                stock: 0,
                trackStock: true,
                isActive: true,
                optionValueIds: [],
              },
            ],
          }}
          tagOptions={tagOptions}
        />
      </div>
    </div>
  );
}
