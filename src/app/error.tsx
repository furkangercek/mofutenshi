"use client";

import { Button } from "@/components/ui/button";
import { errorCopy } from "@/lib/copy/common";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl">{errorCopy.errorTitle}</h1>
      <p className="text-muted max-w-md">{errorCopy.errorBody}</p>
      <div className="mt-2">
        <Button onClick={reset}>{errorCopy.retry}</Button>
      </div>
    </div>
  );
}
