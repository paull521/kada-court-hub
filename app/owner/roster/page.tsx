import { redirect } from "next/navigation";
import { OwnerPlayerDirectoryManagement } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { getOwnerPortalData } from "@/lib/owner-data";
export default async function OwnerRosterOverridesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const data = await getOwnerPortalData();
  if (!data.authorized) redirect("/owner");
  const { view } = await searchParams;
  const selectedView = view === "teams" ? "teams" : "directory";
  const title = selectedView === "directory" ? "Player Directory" : "Teams";
  const subtitle =
    selectedView === "directory"
      ? ""
      : "Choose a season and view the teams in each division.";
  return (
    <OwnerPageShell
      title={title}
      subtitle={subtitle}
      active="teams"
      conferenceId={data.conferenceId}
      conferences={data.conferences}
    >
      <OwnerPlayerDirectoryManagement
        conferenceId={data.conferenceId}
        directory={data.directory}
        seasons={data.seasons}
        requests={data.rosterRequests}
        view={selectedView}
      />
    </OwnerPageShell>
  );
}
