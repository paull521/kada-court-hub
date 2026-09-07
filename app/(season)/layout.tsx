import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import { getPlayerPortalData } from "@/lib/kch-data";

/**
 * Schedule, Standings and Results are three routes and one screen, so the shell
 * and the switcher are built once here rather than three times over.
 *
 * That is what makes the switch readable. A layout is preserved across a
 * navigation between the routes under it, so pressing a tab no longer unmounts
 * the header, the bottom nav and the switcher and builds three new ones - the
 * navy pill stays the same element and finishes the slide it started on press,
 * and loading.tsx beside this file replaces only the body below the switcher.
 * `7202ce8` had ruled this out for the bottom tab strip for exactly the reason
 * it works here: it needs a layout, and this is the layout.
 *
 * Deliberately synchronous. An awaited gate here would hold the whole screen
 * back on the way in, with nothing to show in its place - a layout cannot fall
 * back to the loading.tsx it renders. Each page keeps its own gate instead.
 */
export default function SeasonLayout({ children }: { children: ReactNode }) {
  const data = getPlayerPortalData();
  return (
    <AppShell active="schedule" chrome={data}>
      <SeasonTabs />
      {children}
    </AppShell>
  );
}
