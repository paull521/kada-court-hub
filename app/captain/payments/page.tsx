import { Suspense } from "react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainPaymentsFrame from "@/components/CaptainPaymentsFrame";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function CaptainPaymentsPage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell data={data} active="payments">
      <Suspense fallback={<CaptainPaymentsFrame />}>
        <PaymentList data={data} />
      </Suspense>
    </CaptainShell>
  );
}

async function PaymentList({ data: portal }: { data: Promise<CaptainPortalData> }) {
  return <CaptainPaymentsFrame data={await portal} />;
}
