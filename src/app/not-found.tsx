import { ButtonLink } from "@/components/ui/button";
import { errorCopy } from "@/lib/copy/common";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl">{errorCopy.notFoundTitle}</h1>
      <p className="text-muted max-w-md">{errorCopy.notFoundBody}</p>
      <div className="mt-2">
        <ButtonLink href="/">{errorCopy.backHome}</ButtonLink>
      </div>
    </div>
  );
}
