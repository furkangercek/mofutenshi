import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteTagForm, TagForm } from "@/components/admin/tag-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminTagsCopy } from "@/lib/copy/admin";
import { getAdminTag, getParentTagOptions } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminTagsCopy.title };

export default async function AdminEditTagPage({ params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = await params;
  await requireAdmin(`/admin/tags/${tagId}`);

  const [tag, parentOptions] = await Promise.all([getAdminTag(tagId), getParentTagOptions(tagId)]);
  if (!tag) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminTagsCopy.editTitle(tag.name)}</h1>
      <div className="mt-6">
        <TagForm
          defaults={{
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            type: tag.type,
            parentId: tag.parentId ?? "",
            sortOrder: tag.sortOrder,
            childCount: tag.childCount,
          }}
          parentOptions={parentOptions}
        />
      </div>
      <div className="border-border mt-10 border-t pt-6">
        <DeleteTagForm id={tag.id} name={tag.name} />
      </div>
    </div>
  );
}
