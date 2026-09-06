import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OwnerSetupWizard } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { OwnerContentPlaceholder } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerSetupPage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Season Setup"
      subtitle={`${context.conferenceName} · Create seasons, divisions, and teams.`}
      active="home"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <Suspense fallback={<OwnerContentPlaceholder />}>
        <SetupContent conferenceId={context.conferenceId} conferenceName={context.conferenceName} />
      </Suspense>
    </OwnerPageShell>
  );
}

async function SetupContent({
  conferenceId,
  conferenceName,
}: {
  conferenceId: string;
  conferenceName: string;
}) {
  const data = await getOwnerPortalData();
  return (
    <OwnerSetupWizard
      conferenceId={conferenceId}
      conferenceName={conferenceName}
      seasons={data.seasons}
      directory={data.directory}
    />
  );
}
