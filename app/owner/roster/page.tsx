import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OwnerPlayerDirectoryManagement } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { OwnerContentPlaceholder } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerRosterOverridesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [context, { view }] = await Promise.all([getOwnerConferenceContext(), searchParams]);
  if (!context.authorized) redirect("/owner");
  const selectedView = view === "teams" ? "teams" : "directory";
  const title = selectedView === "directory" ? "Player Directory" : "Teams";
  const subtitle =
    selectedView === "directory" ? "" : "Choose a season and view the teams in each division.";
  return (
    <OwnerPageShell
      title={title}
      subtitle={subtitle}
      active="teams"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <Suspense fallback={<OwnerContentPlaceholder />}>
        <RosterContent conferenceId={context.conferenceId} view={selectedView} />
      </Suspense>
    </OwnerPageShell>
  );
}

async function RosterContent({
  conferenceId,
  view,
}: {
  conferenceId: string;
  view: "teams" | "directory";
}) {
  const data = await getOwnerPortalData();
  return (
    <OwnerPlayerDirectoryManagement
      conferenceId={conferenceId}
      directory={data.directory}
      seasons={data.seasons}
      requests={data.rosterRequests}
      view={view}
    />
  );
}
