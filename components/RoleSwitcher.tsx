"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";
import type { AvailableRoles } from "@/lib/roles";

type Role = "player" | "captain" | "owner";

/**
 * Reports its own Link's pending state up to the switcher. useLinkStatus only
 * works inside a Link, so each one carries a probe rather than the switcher
 * asking. The functional update means the probes cannot fight over the value:
 * whichever link is pending claims it, and only that link may clear it.
 */
function PendingProbe({
  role,
  onChange,
}: {
  role: Role;
  onChange: (next: (prev: Role | null) => Role | null) => void;
}) {
  const { pending } = useLinkStatus();
  useEffect(() => {
    onChange((prev) => (pending ? role : prev === role ? null : prev));
  }, [pending, role, onChange]);
  return null;
}

/**
 * A client component so the pill can move on press. Switching role is a
 * navigation, and the owner workspace takes a moment to arrive - if the pill
 * waited for the new page it would sit still through the part of the wait the
 * viewer is actually watching.
 *
 * The pill moving on press is a promise the rest of the screen has to keep. The
 * workspace has not changed yet, so every other control is still the old one:
 * pressing Owner and then Home used to run Home in the player workspace,
 * because that is what was still on screen. While the switch is in flight the
 * switcher covers the page, so the only thing that can happen next is the
 * workspace that was asked for.
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
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  // The prop wins whenever it changes, so arriving on a page settles the pill
  // even if the press that started the navigation was somewhere else.
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setChosen(current);
  }
  const index = options.findIndex(([role]) => role === chosen);
  if (options.length < 2) return null;
  const switching = pendingRole !== null;
  return (
    <section className="card role-switcher" aria-busy={switching || undefined}>
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
            <PendingProbe role={role} onChange={setPendingRole} />
          </Link>
        ))}
      </div>
      {/* Covers everything, including the tab strip, until the workspace the
          viewer asked for is the one they are looking at. */}
      {switching && <span className="role-switch-lock" aria-hidden="true" />}
    </section>
  );
}
