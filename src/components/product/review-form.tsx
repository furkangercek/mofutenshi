"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { textareaClass } from "@/components/ui/form";
import { submitReviewAction, type ReviewFormState } from "@/lib/actions/reviews";
import { reviewsCopy } from "@/lib/copy/reviews";
import type { OwnReview } from "@/lib/queries/reviews";

const initialState: ReviewFormState = { error: null };

const statusNotes: Record<string, string> = {
  PENDING: reviewsCopy.pendingNote,
  APPROVED: reviewsCopy.approvedNote,
  REJECTED: reviewsCopy.rejectedNote,
};

export function ReviewForm({ productId, own }: { productId: string; own: OwnReview | null }) {
  const [state, formAction, isPending] = useActionState(submitReviewAction, initialState);
  const [rating, setRating] = useState(own?.rating ?? 0);

  return (
    <form action={formAction} className="border-border max-w-xl rounded-lg border p-6">
      <h3 className="font-display text-lg">
        {own ? reviewsCopy.editFormHeading : reviewsCopy.formHeading}
      </h3>
      {own && !state.success && (
        <p className="text-muted mt-1 text-sm">{statusNotes[own.status]}</p>
      )}
      <input type="hidden" name="productId" value={productId} />

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">{reviewsCopy.ratingLegend}</legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((step) => (
            <label
              key={step}
              className="has-focus-visible:outline-ring cursor-pointer rounded p-2 has-focus-visible:outline-2"
            >
              <input
                type="radio"
                name="rating"
                value={step}
                required
                checked={rating === step}
                onChange={() => setRating(step)}
                className="sr-only"
              />
              <Star
                aria-hidden
                className={`size-7 transition-colors ${
                  step <= rating ? "fill-accent stroke-accent" : "stroke-muted fill-transparent"
                }`}
              />
              <span className="sr-only">{reviewsCopy.ratingOption(step)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-medium">
        {reviewsCopy.textLabel}
        <textarea
          name="text"
          rows={4}
          maxLength={1000}
          defaultValue={own?.text ?? ""}
          className={textareaClass}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-muted mt-3 text-sm">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-3 text-sm">
          {reviewsCopy.submitted}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="mt-4">
        {isPending ? reviewsCopy.submitting : reviewsCopy.submit}
      </Button>
    </form>
  );
}
