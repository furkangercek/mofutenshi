export default function CheckoutLoading() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="bg-ghost h-9 w-40 animate-pulse rounded" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-ghost h-16 animate-pulse rounded" />
          ))}
        </div>
        <div className="bg-ghost h-80 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
