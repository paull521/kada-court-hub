import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import TeamFrame from "@/components/TeamFrame";
import { getPlayerPortalData, playerHasTeamContext, type PlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function Team() {
  if (!(await playerHasTeamContext())) redirect("/home");
  const data = getPlayerPortalData();
  return (
    <AppShell contentClass="player-workspace-content" active="team" chrome={data}>
      <Suspense fallback={<TeamFrame />}>
        <TeamBody data={data} />
      </Suspense>
    </AppShell>
  );
}

async function TeamBody({ data: portal }: { data: Promise<PlayerPortalData> }) {
  const data = await portal;
  // playerHasTeamContext() above is the looser test - it sees the registration
  // but not whether its team still resolves. This is the authoritative one the
  // page used to gate on. Reaching it means the two disagreed, which should not
  // happen; the redirect is client-side from here, and correct either way.
  if (!data.contexts.length) redirect("/home");
  return <TeamFrame data={data} />;
}
