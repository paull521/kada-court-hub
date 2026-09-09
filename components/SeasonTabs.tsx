"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/schedule", label: "Schedule" },
  { href: "/standings", label: "Standings" },
  { href: "/results", label: "Results" },
] as const;

/**
 * The season switcher. It is rendered once by the season layout, which survives
 * a navigation between the three routes under it, so this component is not
 * unmounted on press and the navy pill can travel the whole way.
 *
 * It reads the route rather than taking it as a prop, because the layout that
 * renders it is not re-rendered when one of its own routes replaces another -
 * usePathname is the only thing here that knows the view changed. The pill
 * still moves on press rather than on arrival: the press is what the viewer is
 * watching, and the pathname settles it afterwards, so arriving by any other
 * route lands it correctly too.
 */
export default function SeasonTabs() {
  const pathname = usePathname();
  const current = Math.max(
    tabs.findIndex((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)),
    0,
  );
  const [chosen, setChosen] = useState(current);
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setChosen(current);
  }
  return (
    <nav
      className="relative m-[0_0_18px] grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[5px] rounded-[14px] bg-[#efede9] p-[4px] [&_a]:relative [&_a]:grid [&_a]:min-h-[45px] [&_a]:min-w-0 [&_a]:place-items-center [&_a]:rounded-[11px] [&_a]:text-center [&_a]:text-[14px] [&_a]:font-[800] [&_a]:text-muted! [&_a]:transition-colors [&_a]:duration-200 [&_a]:ease-in-out [&_a.active]:text-white!"
      aria-label="Season views"
      style={{ "--season-index": chosen } as React.CSSProperties}
    >
      <i
        className="absolute top-[4px] bottom-[4px] left-[4px] w-[calc((100%_-_8px_-_2_*_5px)/3)] translate-x-[calc(var(--season-index)_*_(100%_+_5px))] rounded-[11px] bg-navy shadow-[0_3px_9px_rgba(7,31,61,0.18)] transition-[translate] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        aria-hidden="true"
      />
      {tabs.map((tab, index) => (
        <Link
          key={tab.href}
          href={tab.href}
          prefetch
          onClick={() => setChosen(index)}
          aria-current={chosen === index ? "page" : undefined}
          className={chosen === index ? "active" : ""}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
