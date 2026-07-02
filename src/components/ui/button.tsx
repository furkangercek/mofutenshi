import Link from "next/link";
import type { ComponentProps } from "react";

const styles = {
  md: "inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-contrast transition-colors hover:bg-primary-hover",
  lg: "inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-contrast transition-colors hover:bg-primary-hover",
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
