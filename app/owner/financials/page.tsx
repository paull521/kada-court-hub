import { Suspense } from "react";
import { redirect } from "next/navigation";
import OwnerFinancialSummary from "@/components/OwnerFinancialSummary";
import OwnerPageShell from "@/components/OwnerPageShell";
import { OwnerContentPlaceholder } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerFinancialsPage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Financial Summary"
      subtitle="Track season income, expenses, and profit or loss."
      active="more"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <Suspense fallback={<OwnerContentPlaceholder />}>
        <FinancialContent />
      </Suspense>
    </OwnerPageShell>
  );
}

async function FinancialContent() {
  const data = await getOwnerPortalData();
  return (
    <OwnerFinancialSummary
      seasons={data.seasons}
      groups={data.paymentGroups}
      financials={data.financials}
    />
  );
}
