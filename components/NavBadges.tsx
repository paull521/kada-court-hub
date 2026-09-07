import { Suspense } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import type { PlayerNotification } from "@/lib/kch-data";

/**
 * The parts of a shell that need portal data: the notification bell and the
 * nav badges. Everything else in a shell - logo, tab bar, title, the page
 * body's own boundary - renders without waiting, so these stream in on their
 * own rather than holding up the first paint.
 *
 * The shells take the portal read as an unresolved promise and hand it here.
 * Each badge awaits it inside its own <Suspense>, and because they all await
 * the same promise there is still exactly one read behind them.
 */
export type ShellChrome = {
  notifications: PlayerNotification[];
  profileNeedsAttention: boolean;
  paymentNeedsAttention: boolean;
  teamHasUnavailable: boolean;
};

export const NAV_ALERT = <i className="nav-alert-dot" aria-label="Action needed" />;

/** Wraps a badge so a slow portal read never blocks the tab bar it sits in. */
export function BadgeSlot({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export async function TeamDot({ chrome }: { chrome: Promise<ShellChrome> }) {
  const { teamHasUnavailable } = await chrome;
  return <i className={`nav-team-dot ${teamHasUnavailable ? "no" : "yes"}`} />;
}

export async function AlertDot({
  chrome,
  field,
}: {
  chrome: Promise<ShellChrome>;
  field: "profileNeedsAttention" | "paymentNeedsAttention";
}) {
  const resolved = await chrome;
  return resolved[field] ? NAV_ALERT : null;
}

export async function ChromeNotifications({ chrome }: { chrome: Promise<ShellChrome> }) {
  const { notifications } = await chrome;
  return <NotificationCenter notifications={notifications} />;
}

/**
 * The bell. Its fallback is the bell itself with nothing in it, not a grey
 * circle: the button, its icon and the sheet it opens are markup, and the only
 * thing in there that needs the portal is the unread count. So the header is
 * live from the first paint and never changes shape - the dot is the only thing
 * that arrives late.
 */
export function NotificationSlot({ chrome }: { chrome: Promise<ShellChrome> }) {
  return (
    <Suspense fallback={<NotificationCenter notifications={[]} />}>
      <ChromeNotifications chrome={chrome} />
    </Suspense>
  );
}
