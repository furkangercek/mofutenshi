import { NotFoundContent } from "@/components/layout/not-found-content";

// Global 404 for URLs matching no route: renders in the bare root layout, so
// it provides its own #main landmark for the skip link.
export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <NotFoundContent />
    </main>
  );
}
