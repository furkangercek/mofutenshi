import { ButtonLink } from "@/components/ui/button";
import { homeCopy, siteCopy } from "@/lib/copy/common";

// Placeholder hero — the real homepage (Sales / New Arrivals / Best Sellers /
// Featured sections) lands with Phase 1 step 3.
export default function Home() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="font-display max-w-2xl text-4xl leading-tight sm:text-5xl">
        {siteCopy.tagline}
      </h1>
      <p className="text-muted max-w-xl text-lg">{siteCopy.description}</p>
      <div className="mt-2">
        <ButtonLink href="/products" size="lg">
          {homeCopy.heroCta}
        </ButtonLink>
      </div>
    </section>
  );
}
