import { cacheLife, cacheTag } from "next/cache";
import { reviewsCopy } from "@/lib/copy/reviews";
import { prisma } from "@/lib/prisma";

export type PublicReview = {
  id: string;
  rating: number;
  text: string | null;
  displayName: string;
  createdAt: Date;
};

export type ProductReviewData = {
  reviews: PublicReview[];
  count: number;
  average: number;
};

// "Furkan Gerçek" -> "Furkan G." — full customer names never reach the
// public storefront.
function maskName(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return reviewsCopy.anonymousName;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toLocaleUpperCase("tr-TR")}.`;
}

export async function getProductReviews(productId: string): Promise<ProductReviewData> {
  "use cache";
  cacheTag("reviews");
  cacheLife({ revalidate: 300, expire: 3600 });

  const reviews = await prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      rating: true,
      text: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  const count = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / count;

  return {
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      displayName: maskName(review.user.name),
      createdAt: review.createdAt,
    })),
    count,
    average,
  };
}

// Per-user data: never "use cache".

export type OwnReview = { rating: number; text: string | null; status: string };

export async function getOwnReview(userId: string, productId: string): Promise<OwnReview | null> {
  return prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { rating: true, text: true, status: true },
  });
}

// R21 eligibility: a PAID or FULFILLED order containing a variant of this
// product. Items whose variant was deleted are unattributable.
export async function hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ["PAID", "FULFILLED"] },
      items: { some: { variant: { productId } } },
    },
    select: { id: true },
  });
  return order !== null;
}

export type AdminReview = {
  id: string;
  rating: number;
  text: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  productName: string;
  productSlug: string;
  customerEmail: string;
};

export async function getReviewsForAdmin(): Promise<AdminReview[]> {
  const reviews = await prisma.review.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      rating: true,
      text: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      product: { select: { name: true, slug: true } },
      user: { select: { email: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    text: review.text,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    productName: review.product.name,
    productSlug: review.product.slug,
    customerEmail: review.user.email,
  }));
}
