import { Suspense } from "react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainScheduleFrame from "@/components/CaptainScheduleFrame";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function CaptainSchedulePage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell contentClass="two-col" data={data} active="schedule">
      <Suspense fallback={<CaptainScheduleFrame />}>
        <ScheduleBody data={data} />
      </Suspense>
    </CaptainShell>
  );
}

async function ScheduleBody({ data: portal }: { data: Promise<CaptainPortalData> }) {
  return <CaptainScheduleFrame data={await portal} />;
}
