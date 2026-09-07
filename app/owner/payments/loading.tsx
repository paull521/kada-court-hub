import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";
import { SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Payments"
      subtitle="Track current-season collections and review past seasons separately."
      active="payments"
    >
      <section className="owner-operations owner-page-section">
        <h2>Season Subscription</h2>
        <p className="operations-intro">Season payment for KCH Platform Creator confirmation.</p>
        <SkeletonCard />
      </section>
      <OwnerSectionFrame
        heading="Season Tracking"
        intro="Each card contains one season and division. Open it for player-level details."
      />
    </OwnerShellFrame>
  );
}
