import type { ElementType, ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The app's one container: white, hairline border, 20px radius, soft shadow.
 * 117 call sites hand-write `className="card"` today, most of them pairing it
 * with a modifier that positions the card - `card join-card`, `card loginbox`.
 *
 * The point of the component is that those 117 sites stop each carrying a copy
 * of the decision. When the card stops being `.card` in globals.css and
 * becomes utilities, it changes here, once.
 */
export function Card({
  as: Tag = "section",
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <Tag className={cx("card", className)} {...rest}>
      {children}
    </Tag>
  );
}
