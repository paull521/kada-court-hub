import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import PaymentsFrame from "@/components/PaymentsFrame";
import { getPlayerPortalData, playerHasTeamContext, type PlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function Payments() {
  if (!(await playerHasTeamContext())) redirect("/home");
  const data = getPlayerPortalData("payments");
  return (
    <AppShell contentClass="two-col" active="payments" chrome={data}>
      <Suspense fallback={<PaymentsFrame />}>
        <PaymentsBody data={data} />
      </Suspense>
    </AppShell>
  );
}

async function PaymentsBody({ data: portal }: { data: Promise<PlayerPortalData> }) {
  const data = await portal;
  // playerHasTeamContext() above is the looser test - it sees the registration
  // but not whether its team still resolves. This is the authoritative one the
  // page used to gate on. Reaching it means the two disagreed, which should not
  // happen; the redirect is client-side from here, and correct either way.
  if (!data.contexts.length) redirect("/home");
  return <PaymentsFrame data={data} />;
}
