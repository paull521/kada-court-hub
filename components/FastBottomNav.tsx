"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

/**
 * `dot` is a node rather than a string discriminator so the shells can hand in
 * a <Suspense> boundary. The nav itself must never suspend - it would remount
 * when it resolved, and the tab the viewer just pressed would snap back to the
 * old one - so the streaming stops at the badge.
 */
type Item = { href: string; key: string; icon: ReactNode; label: string; dot?: ReactNode };

export default function FastBottomNav({
  items,
  active,
  className = "bottom",
  label,
}: {
  items: Item[];
  active: string;
  className?: string;
  label: string;
}) {
  const [chosen, setChosen] = useState(active),
    router = useRouter(),
    pathname = usePathname(),
    destination = items.find((item) => pathname === item.href.split("?")[0])?.key,
    selected = destination ?? chosen;
  return (
    <nav className={className} aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onPointerEnter={() => router.prefetch(item.href)}
          onClick={() => setChosen(item.key)}
          className={`nav ${selected === item.key ? "active" : ""}`}
        >
          <b aria-hidden="true">{item.icon}</b>
          {item.label}
          {item.dot}
        </Link>
      ))}
    </nav>
  );
}
