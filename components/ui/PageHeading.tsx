import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The h1 and the line under it, which appear together at the top of nearly
 * every page. `subtitle` is optional because a few pages carry only the
 * heading, and rendering an empty paragraph would leave its 24px margin behind.
 */
export function PageHeading({
  title,
  subtitle,
  className,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <h1 className={cx("title", className)}>{title}</h1>
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      {children}
    </>
  );
}
