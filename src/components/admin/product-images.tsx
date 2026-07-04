"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import {
  deleteImageAction,
  moveImageAction,
  setPrimaryImageAction,
  updateImageAltAction,
  uploadImageAction,
} from "@/lib/actions/admin-images";
import { adminImagesCopy } from "@/lib/copy/admin";

const initialState: AdminFormState = { error: null, saved: false };

export type AdminImageView = {
  id: string;
  src: string | null;
  alt: string;
  isPrimary: boolean;
};

function UploadForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(uploadImageAction, initialState);

  return (
    <form action={formAction} className="border-border bg-surface rounded-lg border p-4">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium">
          {adminImagesCopy.uploadLabel}
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            className="border-border bg-surface mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="block grow text-sm font-medium sm:max-w-xs">
          {adminImagesCopy.altInputLabel}
          <input name="alt" required minLength={3} className={inputClass} />
        </label>
        <Button type="submit" disabled={isPending}>
          {isPending ? adminImagesCopy.uploading : adminImagesCopy.uploadCta}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-muted mt-2 text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}

function ImageRow({
  image,
  isFirst,
  isLast,
}: {
  image: AdminImageView;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [altState, altAction, altPending] = useActionState(updateImageAltAction, initialState);
  const [primaryState, primaryAction, primaryPending] = useActionState(
    setPrimaryImageAction,
    initialState,
  );
  const [moveState, moveAction, movePending] = useActionState(moveImageAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteImageAction,
    initialState,
  );
  const busy = altPending || primaryPending || movePending || deletePending;
  const error = altState.error ?? primaryState.error ?? moveState.error ?? deleteState.error;

  return (
    <li className={`flex flex-wrap items-start gap-4 py-4 ${busy ? "opacity-60" : ""}`}>
      <div className="border-border bg-ghost relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-md border">
        {image.src ? (
          <Image src={image.src} alt={image.alt} fill sizes="80px" className="object-cover" />
        ) : null}
        {image.isPrimary ? (
          <span className="bg-accent text-ink absolute top-1 left-1 rounded-full px-2 py-0.5 text-xs font-medium">
            {adminImagesCopy.primaryBadge}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 grow flex-col gap-2">
        <form action={altAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="imageId" value={image.id} />
          <label className="block grow text-sm font-medium sm:max-w-xs">
            <span className="sr-only">{adminImagesCopy.altInputLabel}</span>
            <input
              name="alt"
              defaultValue={image.alt}
              required
              minLength={3}
              className={`${inputClass} mt-0`}
            />
          </label>
          <ButtonSecondary type="submit" disabled={busy} className="text-sm">
            {adminImagesCopy.altSave}
          </ButtonSecondary>
        </form>

        <div className="flex flex-wrap gap-2">
          {!image.isPrimary ? (
            <form action={primaryAction}>
              <input type="hidden" name="imageId" value={image.id} />
              <ButtonSecondary type="submit" disabled={busy} className="text-sm">
                {adminImagesCopy.setPrimary}
              </ButtonSecondary>
            </form>
          ) : null}
          {!isFirst ? (
            <form action={moveAction}>
              <input type="hidden" name="imageId" value={image.id} />
              <input type="hidden" name="direction" value="up" />
              <ButtonSecondary type="submit" disabled={busy} className="text-sm">
                {adminImagesCopy.moveUp}
              </ButtonSecondary>
            </form>
          ) : null}
          {!isLast ? (
            <form action={moveAction}>
              <input type="hidden" name="imageId" value={image.id} />
              <input type="hidden" name="direction" value="down" />
              <ButtonSecondary type="submit" disabled={busy} className="text-sm">
                {adminImagesCopy.moveDown}
              </ButtonSecondary>
            </form>
          ) : null}
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm(adminImagesCopy.deleteConfirm)) event.preventDefault();
            }}
          >
            <input type="hidden" name="imageId" value={image.id} />
            <ButtonSecondary type="submit" disabled={busy} className="text-sm">
              {adminImagesCopy.deleteCta}
            </ButtonSecondary>
          </form>
        </div>
        {error && (
          <p role="alert" className="text-muted text-sm">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

export function ProductImagesSection({
  productId,
  images,
  uploadEnabled,
}: {
  productId: string;
  images: AdminImageView[];
  uploadEnabled: boolean;
}) {
  return (
    <section aria-labelledby="product-images" className="flex flex-col gap-4">
      <h2 id="product-images" className="font-display text-xl">
        {adminImagesCopy.heading}
      </h2>
      {uploadEnabled ? (
        <UploadForm productId={productId} />
      ) : (
        <p className="text-muted text-sm">{adminImagesCopy.r2Missing}</p>
      )}
      {images.length === 0 ? (
        <p className="text-muted text-sm">{adminImagesCopy.empty}</p>
      ) : (
        <ul className="divide-border border-border bg-surface divide-y rounded-lg border px-4">
          {images.map((image, index) => (
            <ImageRow
              key={image.id}
              image={image}
              isFirst={index === 0}
              isLast={index === images.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
