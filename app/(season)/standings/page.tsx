import { Suspense } from "react";
import StandingsFrame from "@/components/StandingsFrame";
import { getPlayerPortalData, playerHasTeamContext, type PlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function StandingsPage() {
  if (!(await playerHasTeamContext())) redirect("/home");
  const data = getPlayerPortalData();
  return (
    <Suspense fallback={<StandingsFrame />}>
      <StandingsBody data={data} />
    </Suspense>
  );
}

async function StandingsBody({ data: portal }: { data: Promise<PlayerPortalData> }) {
  const data = await portal;
  // The gate above is the looser test - it sees the registration but not
  // whether its team still resolves. This is the authoritative one.
  if (!data.contexts.length) redirect("/home");
  return <StandingsFrame data={data} />;
}
