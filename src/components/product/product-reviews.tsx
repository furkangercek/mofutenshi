import Link from "next/link";
import { Suspense } from "react";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewStars } from "@/components/product/review-stars";
import { auth } from "@/lib/auth";
import { reviewsCopy } from "@/lib/copy/reviews";
import { getOwnReview, hasPurchasedProduct, type ProductReviewData } from "@/lib/queries/reviews";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

const formatAverage = (average: number) =>
  average.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// The per-user form gate reads the session, so it streams in a dynamic hole
// while the review list itself stays in the cached/prerendered page body.
async function ReviewFormGate({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <p className="text-muted text-sm">
        {reviewsCopy.guestHint}{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/p/${productSlug}`)}`}
          className="hover:text-ink underline underline-offset-4"
        >
          {reviewsCopy.guestLoginCta}
        </Link>
      </p>
    );
  }

  const [eligible, own] = await Promise.all([
    hasPurchasedProduct(session.user.id, productId),
    getOwnReview(session.user.id, productId),
  ]);
  if (!eligible) return <p className="text-muted text-sm">{reviewsCopy.notEligible}</p>;

  return <ReviewForm productId={productId} own={own} />;
}

export function ProductReviews({
  productId,
  productSlug,
  data,
}: {
  productId: string;
  productSlug: string;
  data: ProductReviewData;
}) {
  const { reviews, count, average } = data;

  return (
    <section aria-labelledby="reviews-heading" className="mt-16">
      <h2 id="reviews-heading" className="font-display text-2xl">
        {reviewsCopy.heading}
      </h2>
      {count > 0 ? (
        <p className="text-muted mt-2 flex items-center gap-2 text-sm">
          <ReviewStars rating={Math.round(average)} />
          {reviewsCopy.averageLabel(formatAverage(average), count)}
        </p>
      ) : (
        <p className="text-muted mt-2 text-sm">{reviewsCopy.empty}</p>
      )}

      {reviews.length > 0 && (
        <ul className="divide-border mt-6 divide-y">
          {reviews.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ReviewStars rating={review.rating} />
                <span className="text-sm font-medium">{review.displayName}</span>
                <span className="text-muted text-sm">{dateFormatter.format(review.createdAt)}</span>
              </div>
              {review.text && (
                <p className="text-muted mt-2 text-sm whitespace-pre-line">{review.text}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Suspense fallback={null}>
          <ReviewFormGate productId={productId} productSlug={productSlug} />
        </Suspense>
      </div>
    </section>
  );
}
