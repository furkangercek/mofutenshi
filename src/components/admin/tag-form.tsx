"use client";

import { useActionState, useState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import { deleteTagAction, saveTagAction } from "@/lib/actions/admin-tags";
import { adminCopy, adminTagsCopy } from "@/lib/copy/admin";
import { slugify } from "@/lib/slug";

const initialState: AdminFormState = { error: null, saved: false };

export type TagFormValues = {
  id?: string;
  name: string;
  slug: string;
  type: "HIERARCHICAL" | "FLAT";
  parentId: string;
  sortOrder: number;
  childCount: number;
};

export function TagForm({
  defaults,
  parentOptions,
}: {
  defaults: TagFormValues;
  parentOptions: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(saveTagAction, initialState);
  const [type, setType] = useState(defaults.type);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));
  const hasChildren = defaults.childCount > 0;

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <label className="block text-sm font-medium">
        {adminTagsCopy.nameLabel}
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
        {adminTagsCopy.slugLabel}
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
        <span className="text-muted mt-1 block text-xs font-normal">{adminTagsCopy.slugHint}</span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">{adminTagsCopy.typeLabel}</legend>
        <div className="mt-2 flex flex-col gap-2">
          {(
            [
              ["HIERARCHICAL", adminTagsCopy.typeHierarchical],
              ["FLAT", adminTagsCopy.typeFlat],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="border-border bg-surface has-checked:border-ring flex items-center gap-3 rounded-md border px-4 py-3 text-sm"
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                disabled={hasChildren && value === "FLAT"}
                onChange={() => setType(value)}
                className="accent-ring"
              />
              {label}
            </label>
          ))}
        </div>
        {hasChildren ? (
          <p className="text-muted mt-1 text-xs">{adminTagsCopy.typeLockedHint}</p>
        ) : null}
      </fieldset>

      {type === "HIERARCHICAL" && !hasChildren ? (
        <label className="block text-sm font-medium">
          {adminTagsCopy.parentLabel}
          <select name="parentId" defaultValue={defaults.parentId} className={inputClass}>
            <option value="">{adminTagsCopy.parentNone}</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {type === "HIERARCHICAL" && hasChildren ? (
        <p className="text-muted text-xs">{adminTagsCopy.parentLockedHint}</p>
      ) : null}

      <label className="block text-sm font-medium">
        {adminTagsCopy.sortOrderLabel}
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          required
          defaultValue={defaults.sortOrder}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? adminCopy.common.saving : adminCopy.common.save}
        </Button>
      </div>
    </form>
  );
}

export function DeleteTagForm({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteTagAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(adminTagsCopy.deleteConfirm(name))) event.preventDefault();
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
