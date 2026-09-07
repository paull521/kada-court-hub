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
      className="season-tabs"
      aria-label="Season views"
      style={{ "--season-index": chosen } as React.CSSProperties}
    >
      <i className="season-tabs-thumb" aria-hidden="true" />
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
