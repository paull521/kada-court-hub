import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * `btn primary` (45 sites) and `btn secondary` (30) are the two answers this
 * app gives. A handful more pair `btn` with a one-off modifier, which is what
 * `variant="bare"` plus className is for.
 *
 * Kept as a plain component with no hooks, so it renders in a server component
 * and in a client one without a boundary.
 */
export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: {
  variant?: "primary" | "secondary" | "bare";
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx("btn", variant !== "bare" && variant, className)} {...rest}>
      {children}
    </button>
  );
}
