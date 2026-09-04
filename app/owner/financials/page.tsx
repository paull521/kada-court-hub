import { redirect } from "next/navigation";
import OwnerFinancialSummary from "@/components/OwnerFinancialSummary";
import OwnerPageShell from "@/components/OwnerPageShell";
import { getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerFinancialsPage() {
  const data = await getOwnerPortalData();
  if (!data.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Financial Summary"
      subtitle="Track season income, expenses, and profit or loss."
      active="more"
      conferenceName={data.conferenceName}
      conferenceId={data.conferenceId}
      conferences={data.conferences}
    >
      <OwnerFinancialSummary
        seasons={data.seasons}
        groups={data.paymentGroups}
        financials={data.financials}
      />
    </OwnerPageShell>
  );
}
