import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OwnerGameManagement } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { OwnerContentPlaceholder } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";

/**
 * The page awaits only the conference context - one wave of reads, memoised for
 * the request - so the header, title and bottom nav paint almost immediately.
 * The schedule itself is the expensive read, and it streams into the boundary
 * below once it lands.
 */
export default async function OwnerSchedulePage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Schedule"
      subtitle="Create, update, and finalize regular-season and playoff schedules."
      active="schedule"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <Suspense fallback={<OwnerContentPlaceholder />}>
        <ScheduleContent />
      </Suspense>
    </OwnerPageShell>
  );
}

async function ScheduleContent() {
  const data = await getOwnerPortalData();
  return <OwnerGameManagement seasons={data.seasons} />;
}
