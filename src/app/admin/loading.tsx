export default function AdminLoading() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="bg-ghost h-9 w-48 animate-pulse rounded" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-ghost h-24 animate-pulse rounded-lg" />
        <div className="bg-ghost h-24 animate-pulse rounded-lg" />
        <div className="bg-ghost h-24 animate-pulse rounded-lg" />
        <div className="bg-ghost h-24 animate-pulse rounded-lg" />
      </div>
      <div className="bg-ghost h-64 animate-pulse rounded-lg" />
    </div>
  );
}
