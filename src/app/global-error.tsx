"use client";

import { errorCopy } from "@/lib/copy/common";
import "./globals.css";

// Replaces the root layout when it crashes, so it must render its own
// html/body; next/font variables are unavailable here.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-24 text-center antialiased">
        <h1 className="text-3xl font-semibold">{errorCopy.errorTitle}</h1>
        <p className="text-muted max-w-md">{errorCopy.errorBody}</p>
        <button
          onClick={reset}
          className="bg-primary text-primary-contrast hover:bg-primary-hover mt-2 inline-flex h-11 items-center rounded-md px-6 font-medium transition-colors"
        >
          {errorCopy.retry}
        </button>
      </body>
    </html>
  );
}
