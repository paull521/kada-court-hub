import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** The small gold label above a heading. `SCHEDULE`, `NEXT GAME`, `PAYMENT DUE`. */
export function Eyebrow({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={cx("eyebrow", className)}>{children}</p>;
}
