import { redirect } from "next/navigation";
import OwnerConferenceManagement from "@/components/OwnerConferenceManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { getOwnerConferenceContext } from "@/lib/owner-data";

export default async function OwnerConferencesPage() {
  // This page renders the conference list and nothing else, so it reads the
  // conference context rather than the whole owner portal - the portal's other
  // eighteen requests were all discarded here.
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Conferences"
      subtitle="Create an isolated test conference or switch owner workspaces."
      active="more"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <OwnerConferenceManagement
        currentId={context.conferenceId}
        conferences={context.conferences}
      />
    </OwnerPageShell>
  );
}
