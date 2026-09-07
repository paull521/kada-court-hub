import { Suspense } from "react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainTeamFrame from "@/components/CaptainTeamFrame";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function CaptainTeamPage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell data={data} active="team">
      <Suspense fallback={<CaptainTeamFrame />}>
        <FinalRoster data={data} />
      </Suspense>
    </CaptainShell>
  );
}

async function FinalRoster({ data: portal }: { data: Promise<CaptainPortalData> }) {
  return <CaptainTeamFrame data={await portal} />;
}
