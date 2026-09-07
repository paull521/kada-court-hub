"use client";

import Link from "next/link";
import { useState } from "react";
import type { AvailableRoles } from "@/lib/roles";

type Role = "player" | "captain" | "owner";

/**
 * A client component so the pill can move on press. Switching role is a
 * navigation, and the owner workspace takes a moment to arrive - if the pill
 * waited for the new page it would sit still through the part of the wait the
 * viewer is actually watching.
 */
export default function RoleSwitcher({
  roles,
  current,
  active,
  profile,
}: {
  roles: AvailableRoles;
  current?: Role;
  active?: Role;
  profile?: boolean;
}) {
  current = current ?? active;
  const options = (
    profile
      ? [
          roles.player && ["player", "/profile", "Player"],
          roles.captain && ["captain", "/profile?view=captain", "Captain"],
          roles.owner && ["owner", "/profile?view=owner", "Owner"],
        ]
      : [
          roles.player && ["player", "/home", "Player"],
          roles.captain && ["captain", "/captain", "Captain"],
          roles.owner && ["owner", "/owner", "Owner"],
        ]
  ).filter(Boolean) as [Role, string, string][];
  const [chosen, setChosen] = useState(current);
  // The prop wins whenever it changes, so arriving on a page settles the pill
  // even if the press that started the navigation was somewhere else.
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setChosen(current);
  }
  const index = options.findIndex(([role]) => role === chosen);
  if (options.length < 2) return null;
  return (
    <section className="card role-switcher">
      <small>VIEW AS</small>
      <div
        style={
          {
            "--role-count": options.length,
            "--role-index": index < 0 ? 0 : index,
          } as React.CSSProperties
        }
      >
        {index >= 0 && <i className="role-switcher-thumb" aria-hidden="true" />}
        {options.map(([role, href, label]) => (
          <Link
            key={role}
            href={href}
            prefetch
            onClick={() => setChosen(role)}
            aria-current={chosen === role ? "page" : undefined}
            className={chosen === role ? "active" : ""}
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
