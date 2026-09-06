import { Suspense } from "react";
import { redirect } from "next/navigation";
import OwnerPageShell from "@/components/OwnerPageShell";
import OwnerScoresheets from "@/components/OwnerScoresheets";
import { OwnerContentPlaceholder } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerScoresPage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Scoresheets"
      subtitle="Post final scores without the schedule-management clutter."
      active="home"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <Suspense fallback={<OwnerContentPlaceholder />}>
        <ScoresContent />
      </Suspense>
    </OwnerPageShell>
  );
}

async function ScoresContent() {
  const data = await getOwnerPortalData();
  return <OwnerScoresheets seasons={data.seasons} />;
}
