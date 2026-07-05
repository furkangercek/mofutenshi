import { uiCopy } from "@/lib/copy/common";

const sizeClasses = {
  sm: "size-5 border-2",
  md: "size-8 border-2",
  lg: "size-12 border-4",
} as const;

// The site's one loading mark. The inner <span> is a PLACEHOLDER (spinning
// ring) — swap only that element when the custom brand animation is ready;
// every consumer (boot splash, overlays, pending states) updates with it.
export function Loader({ size = "md" }: { size?: keyof typeof sizeClasses }) {
  return (
    <span role="status" className="inline-flex">
      <span
        aria-hidden
        className={`animate-loader-spin border-primary block rounded-full border-t-transparent ${sizeClasses[size]}`}
      />
      <span className="sr-only">{uiCopy.loading}</span>
    </span>
  );
}

// Dimmer for blocking states (form submits, mutations): covers the nearest
// `relative` ancestor — or the viewport with `fixed` — and blocks input.
export function LoaderOverlay({ label, fixed = false }: { label?: string; fixed?: boolean }) {
  return (
    <div
      role="status"
      aria-label={label ?? uiCopy.loading}
      className={`${fixed ? "fixed" : "absolute"} bg-background/60 inset-0 z-40 flex items-center justify-center backdrop-blur-[2px]`}
    >
      <span aria-hidden className="contents">
        <Loader size="lg" />
      </span>
    </div>
  );
}

// Branded splash on hard page loads. Pure CSS: paints with the first frame,
// self-dismisses (600ms hold + 300ms fade via --animate-splash-out), never
// intercepts input, and reduced-motion users skip it entirely.
export function BootSplash() {
  return (
    <div
      aria-hidden
      className="animate-splash-out bg-background pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
    >
      <Loader size="lg" />
    </div>
  );
}
