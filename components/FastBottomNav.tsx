"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { href: string; key: string; icon: string; label: string; dot?: string };

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
    router = useRouter();
  return (
    <nav className={className} aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onPointerEnter={() => router.prefetch(item.href)}
          onClick={() => setChosen(item.key)}
          className={`nav ${chosen === item.key ? "active" : ""}`}
        >
          <b aria-hidden="true">{item.icon}</b>
          {item.label}
          {item.dot?.startsWith("team") && (
            <i className={`nav-team-dot ${item.dot === "team-no" ? "no" : "yes"}`} />
          )}{" "}
          {item.dot === "alert" && <i className="nav-alert-dot" aria-label="Action needed" />}
        </Link>
      ))}
    </nav>
  );
}
