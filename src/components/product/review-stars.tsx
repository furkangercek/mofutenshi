import { Star } from "lucide-react";
import { reviewsCopy } from "@/lib/copy/reviews";

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={reviewsCopy.starsLabel(rating)}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          aria-hidden
          className={`size-4 ${step <= rating ? "fill-accent stroke-accent" : "stroke-border fill-transparent"}`}
        />
      ))}
    </span>
  );
}
