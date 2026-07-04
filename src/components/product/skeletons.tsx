function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-ghost aspect-4/5 rounded-xl" />
      <div className="bg-ghost mt-2 h-4 w-3/4 rounded" />
    </div>
  );
}

export function ListingContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-ghost h-11 w-full max-w-xl animate-pulse rounded" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="bg-ghost h-9 w-56 animate-pulse rounded" />
      <div className="mt-6">
        <ListingContentSkeleton />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <div className="bg-ghost aspect-4/5 animate-pulse rounded-xl" />
      <div className="animate-pulse space-y-4">
        <div className="bg-ghost h-9 w-3/4 rounded" />
        <div className="bg-ghost h-6 w-32 rounded" />
        <div className="bg-ghost h-24 w-full rounded" />
        <div className="bg-ghost h-11 w-40 rounded-md" />
      </div>
    </div>
  );
}
