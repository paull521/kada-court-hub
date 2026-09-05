import Image from "next/image";
import { CalendarDays, Home, User, Users, Wallet } from "lucide-react";
import FastBottomNav from "@/components/FastBottomNav";
import { SkeletonChip, SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

// Mirrors the links in components/CaptainShell.tsx. Kept local because
// CaptainShell requires a full CaptainPortalData, which this boundary
// renders before there is any data to give it.
const items = [
  { href: "/captain", key: "home", icon: <Home />, label: "Home" },
  { href: "/captain/team", key: "team", icon: <Users />, label: "Teams" },
  { href: "/captain/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/captain/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile", key: "profile", icon: <User />, label: "Profile" },
];

export default function Loading() {
  return (
    <div className="shell captain-shell">
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
      <FastBottomNav items={items} active="home" label="Captain navigation" />
    </div>
  );
}
