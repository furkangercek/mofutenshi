export default function FavoritesLoading() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="bg-ghost h-9 w-44 animate-pulse rounded" />
      <div className="bg-ghost mt-3 h-5 w-72 animate-pulse rounded" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-ghost aspect-4/5 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
