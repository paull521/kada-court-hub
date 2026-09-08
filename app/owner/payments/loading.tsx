import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";
import { SkeletonCard } from "@/components/Skeleton";
import { operationsIntro, ownerOperations, pageSection } from "@/components/ui/shared-classes";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Payments"
      subtitle="Track current-season collections and review past seasons separately."
      active="payments"
    >
      <section className={`${ownerOperations} ${pageSection}`}>
        <h2>Season Subscription</h2>
        <p className={operationsIntro}>Season payment for KCH Platform Creator confirmation.</p>
        <SkeletonCard />
      </section>
      <OwnerSectionFrame
        heading="Season Tracking"
        intro="Each card contains one season and division. Open it for player-level details."
      />
    </OwnerShellFrame>
  );
}
