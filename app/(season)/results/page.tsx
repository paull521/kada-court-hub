import { Suspense } from "react";
import ResultsFrame from "@/components/ResultsFrame";
import { getPlayerPortalData, playerHasTeamContext, type PlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function ResultsPage() {
  if (!(await playerHasTeamContext())) redirect("/home");
  const data = getPlayerPortalData();
  return (
    <Suspense fallback={<ResultsFrame />}>
      <ResultsBody data={data} />
    </Suspense>
  );
}

async function ResultsBody({ data: portal }: { data: Promise<PlayerPortalData> }) {
  const data = await portal;
  // The gate above is the looser test - it sees the registration but not
  // whether its team still resolves. This is the authoritative one.
  if (!data.contexts.length) redirect("/home");
  return <ResultsFrame data={data} />;
}
