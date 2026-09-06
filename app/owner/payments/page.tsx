import { redirect } from "next/navigation";
import { OwnerPastPaymentsArchive, OwnerPaymentManagement } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { getOwnerConferenceId, getOwnerPortalData } from "@/lib/owner-data";
import { getOwnerPaymentBilling } from "@/lib/owner-payment-ledger";
import { OwnerSubscriptionPayment } from "@/components/PlatformCreatorTools";

export default async function OwnerPaymentsPage() {
  // getOwnerPaymentBilling() needs only the conference id, which the owner's
  // own membership settles - it does not depend on anything the portal read
  // returns. Awaiting it after the portal cost a whole extra round trip.
  const [data, billing] = await Promise.all([
    getOwnerPortalData(),
    getOwnerConferenceId().then(getOwnerPaymentBilling),
  ]);
  if (!data.authorized) redirect("/owner");
  const today = new Date().toISOString().slice(0, 10),
    currentSeasonIds = new Set(
      data.seasons
        .filter((season) => !season.canceledAt && season.endsOn >= today)
        .map((season) => season.id),
    ),
    currentGroups = data.paymentGroups.filter((group) => currentSeasonIds.has(group.seasonId)),
    pastGroups = data.paymentGroups.filter((group) => !currentSeasonIds.has(group.seasonId));
  return (
    <OwnerPageShell
      title="Payments"
      subtitle="Track current-season collections and review past seasons separately."
      active="payments"
      conferenceId={data.conferenceId}
      conferences={data.conferences}
    >
      <section className="owner-operations owner-page-section monthly-subscription-section">
        <h2>Season Subscription</h2>
        <p className="operations-intro">Season payment for KCH Platform Creator confirmation.</p>
        <OwnerSubscriptionPayment conferenceId={data.conferenceId} billing={billing} />
      </section>
      <OwnerPaymentManagement submissions={data.paymentSubmissions} groups={currentGroups} />
      <OwnerPastPaymentsArchive groups={pastGroups} />
    </OwnerPageShell>
  );
}
