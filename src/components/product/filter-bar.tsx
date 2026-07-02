"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { filterCopy } from "@/lib/copy/catalog";
import { sortValues, type SortValue } from "@/lib/listing";

const sortLabels: Record<SortValue, string> = {
  newest: filterCopy.sortNewest,
  "price-asc": filterCopy.sortPriceAsc,
  "price-desc": filterCopy.sortPriceDesc,
  "sale-first": filterCopy.sortSaleFirst,
};

const fieldClass =
  "border-border bg-surface h-11 rounded-md border px-3 text-sm focus:outline-2 focus:outline-ring";

// A GET form, so filtering works without JS; with JS each change navigates
// immediately (URL stays shareable, back/forward works — PRD US-03).
export function FilterBar({
  showSaleFilter = true,
  tagOptions,
}: {
  showSaleFilter?: boolean;
  tagOptions?: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(form: HTMLFormElement) {
    const query = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) query.set("q", q);
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string" && value !== "") query.set(key, value);
    }
    query.delete("page");
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  }

  return (
    <form
      method="get"
      aria-label={filterCopy.filtersLabel}
      className="flex flex-wrap items-center gap-3"
      onChange={(event) => {
        // Number inputs navigate on blur/submit, not per keystroke.
        if (event.target instanceof HTMLInputElement && event.target.type === "number") return;
        navigate(event.currentTarget);
      }}
      onBlur={(event) => {
        if (!(event.target instanceof HTMLInputElement) || event.target.type !== "number") return;
        if (event.target.value === (searchParams.get(event.target.name) ?? "")) return;
        navigate(event.currentTarget);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        navigate(event.currentTarget);
      }}
    >
      <label className="flex items-center gap-2 text-sm">
        {filterCopy.sortLabel}
        <select
          name="sort"
          defaultValue={searchParams.get("sort") ?? "newest"}
          className={fieldClass}
        >
          {sortValues.map((value) => (
            <option key={value} value={value}>
              {sortLabels[value]}
            </option>
          ))}
        </select>
      </label>
      {tagOptions && (
        <label className="flex items-center gap-2 text-sm">
          {filterCopy.tagLabel}
          <select name="tag" defaultValue={searchParams.get("tag") ?? ""} className={fieldClass}>
            <option value="">{filterCopy.tagAll}</option>
            {tagOptions.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <input
        type="number"
        name="min"
        min={1}
        inputMode="numeric"
        placeholder={filterCopy.minPrice}
        defaultValue={searchParams.get("min") ?? ""}
        aria-label={filterCopy.minPrice}
        className={`${fieldClass} w-24`}
      />
      <input
        type="number"
        name="max"
        min={1}
        inputMode="numeric"
        placeholder={filterCopy.maxPrice}
        defaultValue={searchParams.get("max") ?? ""}
        aria-label={filterCopy.maxPrice}
        className={`${fieldClass} w-24`}
      />
      {showSaleFilter && (
        <label className="flex h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sale"
            value="1"
            defaultChecked={searchParams.get("sale") === "1"}
            className="accent-ring size-4"
          />
          {filterCopy.onlyOnSale}
        </label>
      )}
      <label className="flex h-11 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="stock"
          value="1"
          defaultChecked={searchParams.get("stock") === "1"}
          className="accent-ring size-4"
        />
        {filterCopy.onlyInStock}
      </label>
      <noscript>
        <button
          type="submit"
          className="border-border bg-surface hover:bg-background h-11 rounded-md border px-4 text-sm font-medium"
        >
          {filterCopy.apply}
        </button>
      </noscript>
    </form>
  );
}
