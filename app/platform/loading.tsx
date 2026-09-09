import KchLogo from "@/components/KchLogo";
import { LoadingNote, SkeletonCard, SkeletonText } from "@/components/Skeleton";

/**
 * Platform operations always load current management data. This boundary only
 * supplies the reusable shell while that read is in flight, so navigation is
 * responsive without showing an old owner, payment, or conference record.
 */
export default function Loading() {
  return (
    <div className="shell owner-shell guided-owner-shell platform-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <SkeletonText width="5em" />
      </header>
      <main className="content owner-content max-desk:pb-12!" role="status" aria-live="polite">
        <LoadingNote />
        <p className="eyebrow">KCH PLATFORM CREATOR</p>
        <h1 className="title">
          <SkeletonText width="8em" />
        </h1>
        <p className="subtitle">Loading platform workspace…</p>
        <section className="grid grid-cols-2 gap-[12px] max-[520px]:grid-cols-1" aria-hidden="true">
          <SkeletonCard count={4} />
        </section>
      </main>
    </div>
  );
}
