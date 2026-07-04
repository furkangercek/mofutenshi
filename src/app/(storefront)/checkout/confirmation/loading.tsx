export default function ConfirmationLoading() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="bg-ghost h-9 w-56 animate-pulse rounded" />
      <div className="bg-ghost mt-3 h-5 w-72 animate-pulse rounded" />
      <div className="bg-ghost mt-6 h-80 animate-pulse rounded-lg" />
    </div>
  );
}
