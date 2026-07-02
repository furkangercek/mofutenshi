import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-contrast transition hover:bg-primary-hover active:scale-[0.97]";

const styles = {
  md: `${base} h-11 px-6`,
  lg: `${base} h-12 px-8`,
};

type Size = keyof typeof styles;

export function Button({ size = "md", ...props }: ComponentProps<"button"> & { size?: Size }) {
  return <button type="button" className={styles[size]} {...props} />;
}

export function ButtonLink({
  size = "md",
  ...props
}: ComponentProps<typeof Link> & { size?: Size }) {
  return <Link className={styles[size]} {...props} />;
}
