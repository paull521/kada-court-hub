import AppShell from "@/components/AppShell";
import { LoadingNote, SkeletonCard, SkeletonText } from "@/components/Skeleton";

/**
 * Player Documents is read from a versioned packet. The records are important
 * enough to wait for, but the player should see that the page is opening
 * immediately rather than be left on the page they just tapped.
 */
export default function Loading() {
  return (
    <AppShell active="profile" contentClass="reading-content">
      <LoadingNote />
      <h1 className="title">Player Documents</h1>
      <p className="subtitle">Loading your documents…</p>
      <section className="card grid gap-[12px] p-[18px]" aria-hidden="true">
        <SkeletonText width="11em" />
        <SkeletonText width="15em" />
        <SkeletonText width="13em" />
      </section>
      <section className="mt-[14px] grid gap-[10px]" aria-hidden="true">
        <SkeletonCard count={3} />
      </section>
    </AppShell>
  );
}
