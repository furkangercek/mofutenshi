export function AuthFormSkeleton({ fieldCount = 2 }: { fieldCount?: number }) {
  return (
    <div aria-hidden className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="bg-ghost h-9 w-40 animate-pulse rounded" />
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: fieldCount }, (_, i) => (
          <div key={i} className="bg-ghost h-16 animate-pulse rounded" />
        ))}
        <div className="bg-ghost h-11 animate-pulse rounded-md" />
      </div>
    </div>
  );
}
