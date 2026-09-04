import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPlatformDashboard } from "@/lib/platform-data";
import { getPlatformOperations } from "@/lib/platform-data";
import { getPlatformOwnerPaymentBilling } from "@/lib/owner-payment-ledger";
import {
  ConferenceDirectory,
  OwnerManagement,
  OwnerPayments,
  SupportRequests,
} from "@/components/PlatformOperations";
import { platformLogoutAction } from "@/app/platform/actions";

const sections = {
  directory: {
    eyebrow: "CONFERENCES",
    title: "Conference Directory",
    subtitle: "View conference activity, owners, divisions, and players.",
  },
  owners: {
    eyebrow: "OWNERS",
    title: "Owner Management",
    subtitle: "Invite owners and manage their platform access.",
  },
  payments: {
    eyebrow: "SUBSCRIPTIONS",
    title: "Owner Payments",
    subtitle: "Track owner Season Subscription payments.",
  },
  announcements: {
    eyebrow: "COMMUNICATION",
    title: "Announcements",
    subtitle: "Create KCH-wide updates for conference owners.",
  },
  support: {
    eyebrow: "OWNER HELP",
    title: "Support",
    subtitle: "Review owner questions and support requests.",
  },
  settings: {
    eyebrow: "PLATFORM",
    title: "Settings",
    subtitle: "Manage platform defaults and Creator account security.",
  },
} as const;

export default async function PlatformSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!(section in sections)) notFound();
  const [data, operations, paymentRecords] = await Promise.all([
    getPlatformDashboard(),
    getPlatformOperations(),
    getPlatformOwnerPaymentBilling(),
  ]);
  if (!data.authorized || !operations.authorized) redirect("/platform/login");
  const item = sections[section as keyof typeof sections];
  const content =
    section === "owners" ? (
      <OwnerManagement owners={operations.owners} candidates={operations.candidates} />
    ) : section === "directory" ? (
      <ConferenceDirectory rows={operations.directory} />
    ) : section === "payments" ? (
      <OwnerPayments records={paymentRecords} />
    ) : section === "support" ? (
      <SupportRequests requests={operations.support} feedback={operations.feedback} />
    ) : section === "settings" ? (
      <form action={platformLogoutAction}>
        <button className="card platform-logout-card" type="submit">
          <b>Log Out</b>
          <strong>›</strong>
        </button>
      </form>
    ) : (
      <section className="card platform-section-note">
        <span>⌁</span>
        <div>
          <b>Workspace ready</b>
          <p>This section is ready for its focused workflow.</p>
        </div>
      </section>
    );
  return (
    <div className="shell owner-shell guided-owner-shell platform-shell">
      <header className="topbar">
        <Image
          src="/kch-logo.png"
          alt="KadaCourtHub"
          width={340}
          height={130}
          className="logo"
          priority
        />
        <Link href="/platform" className="muted platform-signout">
          ‹ Dashboard
        </Link>
      </header>
      <main className="content owner-content platform-content">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 className="title">{item.title}</h1>
        <p className="subtitle">{item.subtitle}</p>
        {content}
      </main>
    </div>
  );
}
