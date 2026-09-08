import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * A long document read inside the app: an iconed header, numbered sections,
 * and a line at the bottom saying it was acknowledged.
 *
 * Four files render it - the rules record, its loading skeleton, the demo
 * overview and the service agreement - and one of those four is the reason
 * this is a component rather than utilities at each site. `app/rules/
 * loading.tsx` is a skeleton, and `settle()` in the visual suite waits it out
 * by definition, so no screenshot can ever photograph it. Written out four
 * times, the skeleton's styling would rest on having transcribed it correctly.
 * Written once here, it is the same output as the two files a screenshot does
 * cover.
 *
 * `footer` takes the element, not its text: /rules puts an acknowledgement
 * form in that slot instead of a footer when the record is unsigned.
 */
export function RulesDocument({
  icon,
  title,
  meta,
  busy,
  footer,
  className,
  children,
}: {
  icon: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  /** Marks the article as loading. Only the skeleton sets it. */
  busy?: boolean;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={cx("card rules-document", className)}>
      <header>
        <span>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{meta}</p>
        </div>
      </header>
      <article aria-busy={busy || undefined}>{children}</article>
      {footer}
    </section>
  );
}
