import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import KchLogo from "@/components/KchLogo";
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
        <button
          className="card flex min-h-[64px] w-full cursor-pointer items-center justify-between p-[13px_16px] text-left font-[inherit] text-[#a51118]"
          type="submit"
        >
          <b className="text-[15px]">Log Out</b>
          <strong aria-hidden="true" className="text-[24px] font-[700]">
            <ChevronRight className="go-caret" />
          </strong>
        </button>
      </form>
    ) : (
      <section className="card grid grid-cols-[38px_1fr] items-center gap-[12px] p-[18px]">
        <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-[#fff4da] text-[20px] text-gold">
          <ClipboardList className="ui-icon" />
        </span>
        <div>
          <b className="text-[15px]">Workspace ready</b>
          <p className="m-[4px_0_0] text-[12px] text-muted">
            This section is ready for its focused workflow.
          </p>
        </div>
      </section>
    );
  return (
    <div className="shell owner-shell guided-owner-shell platform-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <Link href="/platform" className="muted platform-signout">
          <ChevronLeft className="go-caret" /> Dashboard
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
