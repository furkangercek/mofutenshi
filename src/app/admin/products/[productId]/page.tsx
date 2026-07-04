import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteProductForm, ProductForm } from "@/components/admin/product-form";
import { ProductImagesSection } from "@/components/admin/product-images";
import { requireAdmin } from "@/lib/admin-guard";
import { adminProductsCopy } from "@/lib/copy/admin";
import { imageUrl } from "@/lib/image";
import { kurusToInputValue } from "@/lib/money";
import { getAdminProduct, getTagCheckboxOptions } from "@/lib/queries/admin";
import { r2Enabled } from "@/lib/r2";

export const metadata: Metadata = { title: adminProductsCopy.title };

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  await requireAdmin(`/admin/products/${productId}`);

  const [product, tagOptions] = await Promise.all([
    getAdminProduct(productId),
    getTagCheckboxOptions(adminProductsCopy.flatTagsGroup),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminProductsCopy.editTitle(product.name)}</h1>
      {product.images.length === 0 ? (
        <p className="text-muted mt-2 text-sm">{adminProductsCopy.noImagesWarning}</p>
      ) : null}
      <div className="mt-8">
        <ProductImagesSection
          productId={product.id}
          uploadEnabled={r2Enabled}
          images={product.images.map((image) => ({
            id: image.id,
            src: imageUrl(image.key),
            alt: image.alt,
            isPrimary: image.isPrimary,
          }))}
        />
      </div>
      <div className="mt-8">
        <ProductForm
          defaults={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            status: product.status,
            isFeatured: product.isFeatured,
            tagIds: product.tagIds,
            optionTypes: product.optionTypes,
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku ?? "",
              price: kurusToInputValue(variant.priceCents),
              stock: variant.stock,
              isActive: variant.isActive,
              optionValueIds: variant.optionValueIds,
            })),
          }}
          tagOptions={tagOptions}
        />
      </div>
      <div className="border-border mt-10 border-t pt-6">
        <DeleteProductForm id={product.id} name={product.name} />
      </div>
    </div>
  );
}
