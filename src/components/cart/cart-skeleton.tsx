export function CartSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-3 py-4">
          <div className="bg-ghost aspect-4/5 w-16 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="bg-ghost h-4 w-3/4 rounded" />
            <div className="bg-ghost h-4 w-1/3 rounded" />
            <div className="bg-ghost h-10 w-32 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
