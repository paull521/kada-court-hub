import { Suspense } from "react";
import { redirect } from "next/navigation";
import OwnerFinancialSummary from "@/components/OwnerFinancialSummary";
import OwnerPageShell from "@/components/OwnerPageShell";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";
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
      <Suspense
        fallback={
          <OwnerSectionFrame intro="Add other expenses such as uniform, referee, court, and league operations. The page will provide the actual season financial summary." />
        }
      >
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
