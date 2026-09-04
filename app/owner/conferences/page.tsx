import { redirect } from "next/navigation";
import OwnerConferenceManagement from "@/components/OwnerConferenceManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerConferencesPage() {
  const data = await getOwnerPortalData();
  if (!data.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Conferences"
      subtitle="Create an isolated test conference or switch owner workspaces."
      active="more"
      conferenceName={data.conferenceName}
      conferenceId={data.conferenceId}
      conferences={data.conferences}
    >
      <OwnerConferenceManagement currentId={data.conferenceId} conferences={data.conferences} />
    </OwnerPageShell>
  );
}
