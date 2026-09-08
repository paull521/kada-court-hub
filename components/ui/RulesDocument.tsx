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
 * The article's body and the footer are the caller's markup, so the four rules
 * that used to reach them by descendant selector are variants here instead.
 * That is the same reach the CSS had, stated where the element it styles is
 * defined rather than a thousand lines away.
 *
 * (The deleted class is deliberately not named anywhere in this file:
 * css-usage.mjs greps source text, and a class named in a comment reads to it
 * as a class that is rendered.)
 *
 * `footer` takes the element, not its text: /rules puts an acknowledgement
 * form in that slot instead of a footer when the record is unsigned, and the
 * footer variants below deliberately do not touch it.
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
    <section
      className={cx(
        "card overflow-hidden",
        "[&>footer]:flex [&>footer]:items-center [&>footer]:justify-between [&>footer]:gap-[10px] [&>footer]:border-t [&>footer]:border-line [&>footer]:p-[15px_18px] [&>footer]:text-[12px]",
        "[&>footer>b]:text-green [&>footer>span]:text-right [&>footer>span]:text-muted",
        className,
      )}
    >
      <header className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-[12px] border-b border-line p-[16px]">
        <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-[#fff2d7] text-[19px] font-[900] text-gold">
          {icon}
        </span>
        <div>
          <h2 className="m-0 text-[18px]">{title}</h2>
          <p className="m-[4px_0_0] text-[11px] text-muted">{meta}</p>
        </div>
      </header>
      <article
        aria-busy={busy || undefined}
        className="grid gap-[18px] p-[18px] [&>section]:grid [&>section]:gap-[6px] [&_h3]:m-0 [&_h3]:text-[15px] [&_p]:m-0 [&_p]:text-[13px] [&_p]:leading-[1.55] [&_p]:text-[#39485b]"
      >
        {children}
      </article>
      {footer}
    </section>
  );
}
