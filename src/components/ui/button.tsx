import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-contrast transition hover:bg-primary-hover active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const styles = {
  md: `${base} h-11 px-6`,
  lg: `${base} h-12 px-8`,
};

type Size = keyof typeof styles;

export function Button({
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { size?: Size }) {
  return <button type="button" {...props} className={`${styles[size]} ${className}`} />;
}

export function ButtonLink({
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { size?: Size; className?: string }) {
  return <Link {...props} className={`${styles[size]} ${className}`} />;
}
