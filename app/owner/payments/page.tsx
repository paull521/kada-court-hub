import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OwnerPastPaymentsArchive, OwnerPaymentManagement } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";
import { SkeletonCard } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";
import { getOwnerPaymentBilling } from "@/lib/owner-payment-ledger";
import { OwnerSubscriptionPayment } from "@/components/PlatformCreatorTools";

/**
 * Two independent boundaries. The subscription card needs one RPC keyed on the
 * conference id, so it arrives quickly; the collections tables need the whole
 * owner portal. Keeping them apart means the fast half is not held behind the
 * slow half.
 */
export default async function OwnerPaymentsPage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Payments"
      subtitle="Track current-season collections and review past seasons separately."
      active="payments"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <section className="owner-operations owner-page-section monthly-subscription-section">
        <h2>Season Subscription</h2>
        <p className="operations-intro">Season payment for KCH Platform Creator confirmation.</p>
        {/* A plain block rather than a frame of its own: the heading and the
            line above it are already drawn, this boundary covers one card, and
            the collections boundary below carries the page's live region -
            two of them would announce "Loading" twice. */}
        <Suspense fallback={<SkeletonCard />}>
          <SubscriptionSection conferenceId={context.conferenceId} />
        </Suspense>
      </section>
      <Suspense
        fallback={
          <OwnerSectionFrame
            heading="Season Tracking"
            intro="Each card contains one season and division. Open it for player-level details."
          />
        }
      >
        <CollectionsSection />
      </Suspense>
    </OwnerPageShell>
  );
}

async function SubscriptionSection({ conferenceId }: { conferenceId: string }) {
  const billing = await getOwnerPaymentBilling(conferenceId);
  return <OwnerSubscriptionPayment conferenceId={conferenceId} billing={billing} />;
}

async function CollectionsSection() {
  const data = await getOwnerPortalData();
  const today = new Date().toISOString().slice(0, 10),
    currentSeasonIds = new Set(
      data.seasons
        .filter((season) => !season.canceledAt && season.endsOn >= today)
        .map((season) => season.id),
    ),
    currentGroups = data.paymentGroups.filter((group) => currentSeasonIds.has(group.seasonId)),
    pastGroups = data.paymentGroups.filter((group) => !currentSeasonIds.has(group.seasonId));
  return (
    <>
      <OwnerPaymentManagement submissions={data.paymentSubmissions} groups={currentGroups} />
      <OwnerPastPaymentsArchive groups={pastGroups} />
    </>
  );
}
