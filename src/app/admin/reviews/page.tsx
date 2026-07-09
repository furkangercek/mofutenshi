import type { Metadata } from "next";
import Link from "next/link";
import { ReviewStars } from "@/components/product/review-stars";
import { ButtonSecondary } from "@/components/ui/button";
import { approveReviewAction, rejectReviewAction } from "@/lib/actions/admin-reviews";
import { requireAdmin } from "@/lib/admin-guard";
import { adminReviewsCopy } from "@/lib/copy/reviews";
import { getReviewsForAdmin, type AdminReview } from "@/lib/queries/reviews";

export const metadata: Metadata = { title: adminReviewsCopy.title };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function ReviewRow({ review }: { review: AdminReview }) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ReviewStars rating={review.rating} />
          <Link
            href={`/p/${review.productSlug}`}
            className="text-sm font-medium underline underline-offset-4"
          >
            {review.productName}
          </Link>
          <span className="text-muted text-sm">{review.customerEmail}</span>
          <span className="text-muted text-sm">{dateFormatter.format(review.updatedAt)}</span>
          <span className="bg-background border-border rounded-full border px-2.5 py-0.5 text-xs">
            {adminReviewsCopy.statusLabels[review.status]}
          </span>
        </div>
        {review.text && (
          <p className="text-muted mt-2 text-sm whitespace-pre-line">{review.text}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {review.status !== "APPROVED" && (
          <form action={approveReviewAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <ButtonSecondary type="submit" className="text-sm">
              {adminReviewsCopy.approve}
            </ButtonSecondary>
          </form>
        )}
        {review.status !== "REJECTED" && (
          <form action={rejectReviewAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <ButtonSecondary type="submit" className="text-sm">
              {adminReviewsCopy.reject}
            </ButtonSecondary>
          </form>
        )}
      </div>
    </li>
  );
}

export default async function AdminReviewsPage() {
  await requireAdmin("/admin/reviews");
  const reviews = await getReviewsForAdmin();
  const pending = reviews.filter((review) => review.status === "PENDING");
  const decided = reviews.filter((review) => review.status !== "PENDING");

  return (
    <div>
      <h1 className="font-display text-3xl">{adminReviewsCopy.title}</h1>

      {reviews.length === 0 ? (
        <p className="text-muted mt-6">{adminReviewsCopy.empty}</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-xl">{adminReviewsCopy.pendingHeading}</h2>
              <ul className="border-border bg-surface divide-border mt-3 divide-y rounded-lg border">
                {pending.map((review) => (
                  <ReviewRow key={review.id} review={review} />
                ))}
              </ul>
            </section>
          )}
          {decided.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl">{adminReviewsCopy.decidedHeading}</h2>
              <ul className="border-border bg-surface divide-border mt-3 divide-y rounded-lg border">
                {decided.map((review) => (
                  <ReviewRow key={review.id} review={review} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
