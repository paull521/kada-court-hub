import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The three things a form says back: it failed, it worked, or read this first.
 * All three share a shape in globals.css and differ only in colour, which is
 * why they are one component and not three.
 */
export function FormMessage({
  tone,
  className,
  children,
}: {
  tone: "error" | "success" | "note";
  className?: string;
  children?: ReactNode;
}) {
  const cls = tone === "error" ? "form-error" : tone === "success" ? "form-success" : "setup-note";
  return (
    <p className={cx(cls, className)} role={tone === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
