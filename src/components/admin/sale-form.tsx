"use client";

import { useActionState, useState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import { deleteSaleAction, endSaleEarlyAction, saveSaleAction } from "@/lib/actions/admin-sales";
import { adminCopy, adminSalesCopy } from "@/lib/copy/admin";
import type { TagCheckboxOption } from "@/lib/queries/admin";

const initialState: AdminFormState = { error: null, saved: false };

export type SaleFormValues = {
  id?: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: string;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  tagIds: string[];
};

export function SaleForm({
  defaults,
  tagOptions,
  productOptions,
}: {
  defaults: SaleFormValues;
  tagOptions: TagCheckboxOption[];
  productOptions: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(saveSaleAction, initialState);
  const [type, setType] = useState(defaults.type);
  const tagGroups = [...new Set(tagOptions.map((option) => option.group))];

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <label className="block text-sm font-medium">
        {adminSalesCopy.nameLabel}
        <input name="name" required defaultValue={defaults.name} className={inputClass} />
      </label>

      <fieldset>
        <legend className="text-sm font-medium">{adminSalesCopy.typeLabel}</legend>
        <div className="mt-2 flex gap-3">
          {(
            [
              ["PERCENT", adminSalesCopy.typePercent],
              ["FIXED", adminSalesCopy.typeFixed],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="border-border bg-surface has-checked:border-ring flex items-center gap-2 rounded-md border px-4 py-3 text-sm"
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="accent-ring"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block max-w-xs text-sm font-medium">
        {type === "PERCENT" ? adminSalesCopy.percentValueLabel : adminSalesCopy.fixedValueLabel}
        <input
          name="value"
          required
          inputMode={type === "PERCENT" ? "numeric" : "decimal"}
          defaultValue={defaults.value}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {adminSalesCopy.startsAtLabel}
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={defaults.startsAt}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {adminSalesCopy.endsAtLabel}
          <input
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={defaults.endsAt}
            className={inputClass}
          />
        </label>
      </div>

      <section aria-labelledby="sale-scope" className="flex flex-col gap-3">
        <h2 id="sale-scope" className="font-display text-xl">
          {adminSalesCopy.scopeHeading}
        </h2>
        <p className="text-muted text-sm">{adminSalesCopy.scopeHint}</p>

        <p className="text-sm font-medium">{adminSalesCopy.scopeTags}</p>
        {tagGroups.map((group) => (
          <fieldset key={group}>
            <legend className="text-muted text-xs font-medium tracking-wide uppercase">
              {group}
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
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
        ))}

        <p className="mt-2 text-sm font-medium">{adminSalesCopy.scopeProducts}</p>
        {productOptions.length === 0 ? (
          <p className="text-muted text-sm">{adminSalesCopy.scopeProductsEmpty}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {productOptions.map((option) => (
              <label
                key={option.id}
                className="border-border bg-surface has-checked:border-ring flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="productIds"
                  value={option.id}
                  defaultChecked={defaults.productIds.includes(option.id)}
                  className="accent-ring"
                />
                {option.name}
              </label>
            ))}
          </div>
        )}
      </section>

      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
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

export function EndSaleEarlyForm({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(endSaleEarlyAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(adminSalesCopy.endEarlyConfirm(name))) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {state.error && (
        <p role="alert" className="text-muted mb-2 text-sm">
          {state.error}
        </p>
      )}
      <ButtonSecondary type="submit" disabled={isPending} className="text-sm">
        {adminSalesCopy.endEarlyCta}
      </ButtonSecondary>
    </form>
  );
}

export function DeleteSaleForm({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteSaleAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(adminSalesCopy.deleteConfirm(name))) event.preventDefault();
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
