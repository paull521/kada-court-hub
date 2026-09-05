import Image from "next/image";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { SkeletonChip, SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="shell owner-shell guided-owner-shell">
      <header className="topbar">
        <Image
          src="/kch-logo.png"
          alt="KadaCourtHub"
          width={340}
          height={130}
          className="logo"
          priority
        />
        <div className="topbar-actions">
          <SkeletonChip />
        </div>
      </header>
      <main className="content">
        <div role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading</span>
          <SkeletonTitle />
          <SkeletonCard count={2} />
          <SkeletonRow count={4} />
        </div>
      </main>
      <OwnerBottomNav active="home" />
    </div>
  );
}
