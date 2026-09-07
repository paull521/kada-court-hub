import { Suspense } from "react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainAvailabilityFrame from "@/components/CaptainAvailabilityFrame";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function CaptainAvailabilityPage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell
      data={data}
      active="team"
      title="Availability"
      subtitle="See who is playing in the next game."
    >
      <Suspense fallback={<CaptainAvailabilityFrame />}>
        <AvailabilityBody data={data} />
      </Suspense>
    </CaptainShell>
  );
}

async function AvailabilityBody({ data: portal }: { data: Promise<CaptainPortalData> }) {
  return <CaptainAvailabilityFrame data={await portal} />;
}
