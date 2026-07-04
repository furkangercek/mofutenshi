import type { Metadata } from "next";
import { TagForm } from "@/components/admin/tag-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminTagsCopy } from "@/lib/copy/admin";
import { getParentTagOptions } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminTagsCopy.newTitle };

export default async function AdminNewTagPage() {
  await requireAdmin("/admin/tags/new");
  const parentOptions = await getParentTagOptions();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminTagsCopy.newTitle}</h1>
      <div className="mt-6">
        <TagForm
          defaults={{
            name: "",
            slug: "",
            type: "HIERARCHICAL",
            parentId: "",
            sortOrder: 0,
            childCount: 0,
          }}
          parentOptions={parentOptions}
        />
      </div>
    </div>
  );
}
