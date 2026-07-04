"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import { deleteProductAction, saveProductAction } from "@/lib/actions/admin-products";
import { adminCopy, adminProductsCopy } from "@/lib/copy/admin";
import { slugify } from "@/lib/slug";
import type { TagCheckboxOption } from "@/lib/queries/admin";

const initialState: AdminFormState = { error: null, saved: false };

type OptionValueState = { key: string; id?: string; value: string };
type OptionTypeState = { key: string; id?: string; name: string; values: OptionValueState[] };
type VariantCell = { id?: string; sku: string; price: string; stock: number; isActive: boolean };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  tagIds: string[];
  optionTypes: { id: string; name: string; values: { id: string; value: string }[] }[];
  variants: {
    id: string;
    sku: string;
    price: string;
    stock: number;
    isActive: boolean;
    optionValueIds: string[];
  }[];
};

const emptyCell: VariantCell = { sku: "", price: "", stock: 0, isActive: true };

function signatureOf(keys: string[]): string {
  return [...keys].sort().join("|");
}

// Cartesian product of option values, one combination per variant row.
function combosOf(optionTypes: OptionTypeState[]): { keys: string[]; label: string }[] {
  return optionTypes.reduce<{ keys: string[]; label: string }[]>(
    (acc, type) =>
      acc.flatMap((combo) =>
        type.values.map((value) => ({
          keys: [...combo.keys, value.key],
          label: combo.label ? `${combo.label} / ${value.value}` : value.value,
        })),
      ),
    [{ keys: [], label: "" }],
  );
}

export function ProductForm({
  defaults,
  tagOptions,
}: {
  defaults: ProductFormValues;
  tagOptions: TagCheckboxOption[];
}) {
  const [state, formAction, isPending] = useActionState(saveProductAction, initialState);
  const keyCounter = useRef(0);
  const nextKey = () => `n${keyCounter.current++}`;

  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));
  const [optionTypes, setOptionTypes] = useState<OptionTypeState[]>(() =>
    defaults.optionTypes.map((type) => ({
      key: type.id,
      id: type.id,
      name: type.name,
      values: type.values.map((value) => ({ key: value.id, id: value.id, value: value.value })),
    })),
  );
  const [cells, setCells] = useState<Record<string, VariantCell>>(() =>
    Object.fromEntries(
      defaults.variants.map((variant) => [
        signatureOf(variant.optionValueIds),
        {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          isActive: variant.isActive,
        },
      ]),
    ),
  );

  const combos = useMemo(() => combosOf(optionTypes), [optionTypes]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        optionTypes: optionTypes.map((type) => ({
          id: type.id,
          name: type.name,
          values: type.values.map((value) => ({
            key: value.key,
            id: value.id,
            value: value.value,
          })),
        })),
        variants: combos.map((combo) => {
          const cell = cells[signatureOf(combo.keys)] ?? emptyCell;
          return {
            id: cell.id,
            valueKeys: combo.keys,
            sku: cell.sku,
            price: cell.price,
            stock: cell.stock,
            isActive: cell.isActive,
          };
        }),
      }),
    [optionTypes, combos, cells],
  );

  const updateCell = (signature: string, patch: Partial<VariantCell>) => {
    setCells((current) => ({
      ...current,
      [signature]: { ...(current[signature] ?? emptyCell), ...patch },
    }));
  };

  const groups = [...new Set(tagOptions.map((option) => option.group))];

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-10">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="payload" value={payload} />

      <section aria-labelledby="product-basics" className="flex flex-col gap-4">
        <h2 id="product-basics" className="font-display text-xl">
          {adminProductsCopy.basicsHeading}
        </h2>
        <label className="block text-sm font-medium">
          {adminProductsCopy.nameLabel}
          <input
            name="name"
            required
            defaultValue={defaults.name}
            onChange={(event) => {
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {adminProductsCopy.slugLabel}
          <input
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className={inputClass}
          />
          <span className="text-muted mt-1 block text-xs font-normal">
            {adminProductsCopy.slugHint}
          </span>
        </label>
        <label className="block text-sm font-medium">
          {adminProductsCopy.descriptionLabel}
          <textarea
            name="description"
            rows={8}
            defaultValue={defaults.description}
            className={textareaClass}
          />
        </label>
        <fieldset>
          <legend className="text-sm font-medium">{adminProductsCopy.statusLabel}</legend>
          <div className="mt-2 flex gap-3">
            {(["DRAFT", "PUBLISHED"] as const).map((status) => (
              <label
                key={status}
                className="border-border bg-surface has-checked:border-ring flex items-center gap-2 rounded-md border px-4 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="status"
                  value={status}
                  defaultChecked={defaults.status === status}
                  className="accent-ring"
                />
                {adminProductsCopy.statusLabels[status]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            name="isFeatured"
            type="checkbox"
            defaultChecked={defaults.isFeatured}
            className="accent-ring size-4"
          />
          {adminProductsCopy.featuredLabel}
        </label>
      </section>

      <section aria-labelledby="product-tags" className="flex flex-col gap-3">
        <h2 id="product-tags" className="font-display text-xl">
          {adminProductsCopy.tagsHeading}
        </h2>
        <p className="text-muted text-sm">{adminProductsCopy.tagsHint}</p>
        {tagOptions.length === 0 ? (
          <p className="text-muted text-sm">{adminProductsCopy.tagsEmpty}</p>
        ) : (
          groups.map((group) => (
            <fieldset key={group}>
              <legend className="text-sm font-medium">{group}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {tagOptions
                  .filter((option) => option.group === group)
                  .map((option) => (
                    <label
                      key={option.id}
                      className="border-border bg-surface has-checked:border-ring flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="tagIds"
                        value={option.id}
                        defaultChecked={defaults.tagIds.includes(option.id)}
                        className="accent-ring"
                      />
                      {option.label}
                    </label>
                  ))}
              </div>
            </fieldset>
          ))
        )}
      </section>

      <section aria-labelledby="product-options" className="flex flex-col gap-4">
        <h2 id="product-options" className="font-display text-xl">
          {adminProductsCopy.optionsHeading}
        </h2>
        <p className="text-muted text-sm">{adminProductsCopy.optionsHint}</p>
        {optionTypes.map((type, typeIndex) => (
          <div key={type.key} className="border-border bg-surface rounded-lg border p-4">
            <div className="flex items-end gap-3">
              <label className="block grow text-sm font-medium">
                {adminProductsCopy.optionNameLabel}
                <input
                  value={type.name}
                  onChange={(event) =>
                    setOptionTypes((current) =>
                      current.map((t, i) =>
                        i === typeIndex ? { ...t, name: event.target.value } : t,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </label>
              <ButtonSecondary
                className="shrink-0 text-sm"
                onClick={() =>
                  setOptionTypes((current) => current.filter((_, i) => i !== typeIndex))
                }
              >
                {adminProductsCopy.removeOptionType}
              </ButtonSecondary>
            </div>
            <p className="mt-4 text-sm font-medium">{adminProductsCopy.optionValuesLabel}</p>
            <div className="mt-2 flex flex-col gap-2">
              {type.values.map((value, valueIndex) => (
                <div key={value.key} className="flex items-center gap-2">
                  <input
                    value={value.value}
                    aria-label={`${adminProductsCopy.optionValuesLabel} ${valueIndex + 1}`}
                    onChange={(event) =>
                      setOptionTypes((current) =>
                        current.map((t, i) =>
                          i === typeIndex
                            ? {
                                ...t,
                                values: t.values.map((v, j) =>
                                  j === valueIndex ? { ...v, value: event.target.value } : v,
                                ),
                              }
                            : t,
                        ),
                      )
                    }
                    className={`${inputClass} mt-0`}
                  />
                  {type.values.length > 1 ? (
                    <ButtonSecondary
                      className="shrink-0 text-sm"
                      onClick={() =>
                        setOptionTypes((current) =>
                          current.map((t, i) =>
                            i === typeIndex
                              ? { ...t, values: t.values.filter((_, j) => j !== valueIndex) }
                              : t,
                          ),
                        )
                      }
                    >
                      {adminProductsCopy.removeValue}
                    </ButtonSecondary>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-3">
              <ButtonSecondary
                className="text-sm"
                disabled={type.values.length >= 30}
                onClick={() =>
                  setOptionTypes((current) =>
                    current.map((t, i) =>
                      i === typeIndex
                        ? { ...t, values: [...t.values, { key: nextKey(), value: "" }] }
                        : t,
                    ),
                  )
                }
              >
                {adminProductsCopy.addValue}
              </ButtonSecondary>
            </div>
          </div>
        ))}
        <div>
          <ButtonSecondary
            className="text-sm"
            disabled={optionTypes.length >= 4}
            onClick={() =>
              setOptionTypes((current) => [
                ...current,
                { key: nextKey(), name: "", values: [{ key: nextKey(), value: "" }] },
              ])
            }
          >
            {adminProductsCopy.addOptionType}
          </ButtonSecondary>
        </div>
      </section>

      <section aria-labelledby="product-variants" className="flex flex-col gap-3">
        <h2 id="product-variants" className="font-display text-xl">
          {adminProductsCopy.variantsHeading}
        </h2>
        {optionTypes.length === 0 ? (
          <p className="text-muted text-sm">{adminProductsCopy.variantsSingleHint}</p>
        ) : null}
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="bg-surface w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-border text-muted border-b text-left">
                <th className="px-3 py-2 font-medium">{adminProductsCopy.variantsHeading}</th>
                <th className="px-3 py-2 font-medium">{adminProductsCopy.skuLabel}</th>
                <th className="px-3 py-2 font-medium">{adminProductsCopy.priceLabel}</th>
                <th className="px-3 py-2 font-medium">{adminProductsCopy.stockLabel}</th>
                <th className="px-3 py-2 font-medium">{adminProductsCopy.activeLabel}</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => {
                const signature = signatureOf(combo.keys);
                const cell = cells[signature] ?? emptyCell;
                const label = combo.label || adminProductsCopy.variantDefaultLabel;
                return (
                  <tr key={signature || "default"} className="border-border border-b last:border-0">
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      {label}
                    </th>
                    <td className="px-3 py-2">
                      <input
                        value={cell.sku}
                        aria-label={`${label} ${adminProductsCopy.skuLabel}`}
                        onChange={(event) => updateCell(signature, { sku: event.target.value })}
                        className={`${inputClass} mt-0 min-w-24`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={cell.price}
                        required
                        inputMode="decimal"
                        aria-label={`${label} ${adminProductsCopy.priceLabel}`}
                        onChange={(event) => updateCell(signature, { price: event.target.value })}
                        className={`${inputClass} mt-0 min-w-24`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={1000000}
                        value={cell.stock}
                        aria-label={`${label} ${adminProductsCopy.stockLabel}`}
                        onChange={(event) =>
                          updateCell(signature, { stock: Number(event.target.value) })
                        }
                        className={`${inputClass} mt-0 min-w-20`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={cell.isActive}
                        aria-label={`${label} ${adminProductsCopy.activeLabel}`}
                        onChange={(event) =>
                          updateCell(signature, { isActive: event.target.checked })
                        }
                        className="accent-ring size-4"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p role="status" className="text-sm font-medium">
          {adminCopy.common.saved}
        </p>
      )}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? adminCopy.common.saving : adminCopy.common.save}
        </Button>
      </div>
    </form>
  );
}

export function DeleteProductForm({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteProductAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(adminProductsCopy.deleteConfirm(name))) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {state.error && (
        <p role="alert" className="text-muted mb-2 text-sm">
          {state.error}
        </p>
      )}
      <ButtonSecondary type="submit" disabled={isPending} className="text-sm">
        {adminCopy.common.delete}
      </ButtonSecondary>
    </form>
  );
}
