import KchLogo from "@/components/KchLogo";
import { Suspense, type ReactNode } from "react";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks } from "@/lib/nav-links";
import { BadgeSlot, NAV_ALERT, NotificationSlot, type ShellChrome } from "@/components/NavBadges";
import { SkeletonChip, SkeletonTitle } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";

export type CaptainNavKey = (typeof captainNavLinks)[number]["key"] | "dashboard" | "more";

/**
 * Takes the captain portal read unresolved, so the logo, tab bar and page body
 * paint before it lands. Only the bell, the roster badge and - on the pages
 * headed by the team name - the title wait, each behind its own boundary.
 *
 * Four of the seven captain pages are headed by the team name and its division,
 * which are portal fields. Rather than have each of them pass a streamed node,
 * omitting title/subtitle here means "use the team heading" and the shell
 * streams it once, in one place.
 */
export default function CaptainShell({
  data,
  active,
  title,
  subtitle,
  children,
  contentClass = "",
}: {
  data: Promise<CaptainPortalData>;
  active: CaptainNavKey;
  /** Omit for the team-name heading the four team pages share. */
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  contentClass?: string;
}) {
  const selected = active === "dashboard" ? "home" : active === "more" ? "profile" : active;
  // CaptainPortalData calls this hasUnavailable; ShellChrome calls the same idea
  // teamHasUnavailable. Adapted here rather than renaming a field the whole
  // captain workspace reads.
  const chrome: Promise<ShellChrome> = data.then((resolved) => ({
    notifications: resolved.notifications,
    profileNeedsAttention: false,
    paymentNeedsAttention: false,
    teamHasUnavailable: resolved.hasUnavailable,
  }));
  const items = captainNavLinks.map(({ href, key, icon, label }) => ({
    href,
    key,
    icon,
    label,
    dot:
      key === "team" ? (
        <BadgeSlot>
          <RosterAlert data={data} />
        </BadgeSlot>
      ) : undefined,
  }));
  return (
    <div className="shell captain-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <div className="topbar-actions">
          <NotificationSlot chrome={chrome} />
        </div>
      </header>
      <FastBottomNav
        items={items}
        active={selected}
        className="bottom captain-bottom"
        label="Captain navigation"
      />
      <main className={`content captain-content ${contentClass}`.trim()}>
        <h1 className="title">
          {title ?? (
            <Suspense fallback={<SkeletonTitle />}>
              <TeamName data={data} />
            </Suspense>
          )}
        </h1>
        <p className="subtitle">
          {subtitle ??
            (title ? null : (
              <Suspense fallback={<SkeletonChip />}>
                <TeamContext data={data} />
              </Suspense>
            ))}
        </p>
        {children}
      </main>
    </div>
  );
}

async function RosterAlert({ data }: { data: Promise<CaptainPortalData> }) {
  const { hasUnavailable } = await data;
  return hasUnavailable ? NAV_ALERT : null;
}

async function TeamName({ data }: { data: Promise<CaptainPortalData> }) {
  return (await data).teamName;
}

async function TeamContext({ data }: { data: Promise<CaptainPortalData> }) {
  const { divisionName, seasonName } = await data;
  return `${divisionName} · ${seasonName}`;
}
