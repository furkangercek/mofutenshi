import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin-guard";
import { adminTagsCopy } from "@/lib/copy/admin";
import { getAdminTags, type AdminTagRow } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminTagsCopy.title };

function TagRow({ tag, indent = false }: { tag: AdminTagRow; indent?: boolean }) {
  return (
    <li>
      <Link
        href={`/admin/tags/${tag.id}`}
        className={`hover:bg-ghost flex items-baseline justify-between gap-3 rounded-md px-2 py-3 transition ${indent ? "ml-6" : ""}`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">{tag.name}</span>
          <span className="text-muted block text-sm">/t/{tag.slug}</span>
        </span>
        <span className="text-muted text-sm whitespace-nowrap">
          {adminTagsCopy.productCount(tag.productCount)} · {adminTagsCopy.sortOrderShort}{" "}
          {tag.sortOrder}
        </span>
      </Link>
      {tag.children.length > 0 ? (
        <ul>
          {tag.children.map((child) => (
            <TagRow key={child.id} tag={child} indent />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function AdminTagsPage() {
  await requireAdmin("/admin/tags");
  const { hierarchical, flat } = await getAdminTags();
  const isEmpty = hierarchical.length === 0 && flat.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{adminTagsCopy.title}</h1>
        <ButtonLink href="/admin/tags/new">{adminTagsCopy.newCta}</ButtonLink>
      </div>

      {isEmpty ? (
        <p className="text-muted mt-6">{adminTagsCopy.empty}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {hierarchical.length > 0 ? (
            <section className="border-border bg-surface rounded-lg border p-6">
              <h2 className="font-display text-xl">{adminTagsCopy.hierarchicalHeading}</h2>
              <ul className="divide-border mt-2 divide-y">
                {hierarchical.map((tag) => (
                  <TagRow key={tag.id} tag={tag} />
                ))}
              </ul>
            </section>
          ) : null}
          {flat.length > 0 ? (
            <section className="border-border bg-surface rounded-lg border p-6">
              <h2 className="font-display text-xl">{adminTagsCopy.flatHeading}</h2>
              <ul className="divide-border mt-2 divide-y">
                {flat.map((tag) => (
                  <TagRow key={tag.id} tag={tag} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
