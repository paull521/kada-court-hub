import { CalendarDays, ClipboardList, Settings, User, Wallet } from "lucide-react";
import KchLogo from "@/components/KchLogo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformDashboard } from "@/lib/platform-data";
import { dashboardQuestion } from "@/components/ui/shared-classes";
import { platformAttention } from "@/components/ui/auth-classes";

export default async function PlatformCreatorPage() {
  const data = await getPlatformDashboard();
  if (!data.authorized) redirect("/platform/login");
  return (
    <div className="shell owner-shell guided-owner-shell platform-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <Link href="/login" className="muted text-xs">
          Player sign in
        </Link>
      </header>
      <main className="content owner-content max-desk:pb-12! [&>form]:m-0">
        <p className="eyebrow">KCH PLATFORM CREATOR</p>
        <h1 className="title">Welcome, {data.adminName.split(" ")[0] || "Creator"}.</h1>
        <p className={dashboardQuestion}>Platform overview.</p>
        <nav
          className="grid grid-cols-2 gap-[12px] max-[520px]:grid-cols-1"
          aria-label="Platform creator actions"
        >
          <Link
            href="/platform/owners"
            className="card relative grid min-h-[198px] content-start gap-[8px] overflow-hidden p-[18px] [&>h2]:m-0 [&>h2]:text-[19px] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:text-[12px] [&>p:not(.eyebrow)]:leading-[1.45] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:mt-[2px]! [&_.eyebrow]:mb-0! [&_.eyebrow]:text-[10px]! border-[#08243e]! bg-[linear-gradient(135deg,#08243e,#0a3767)]! text-white! [&>p:not(.eyebrow)]:text-[#d6e2ed] [&_.eyebrow]:text-[#f6bf55] [&_.platform-icon]:bg-[rgba(245,163,19,0.18)] [&_.platform-icon]:text-[#f6bf55]"
          >
            <span className="platform-icon grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#fff4da] text-[22px] text-gold">
              <User className="ui-icon" />
            </span>
            <p className="eyebrow">OWNERS</p>
            <h2>Owner Management</h2>
            <p>Create and manage owner access.</p>
          </Link>
          <Link
            href="/platform/payments"
            className="card relative grid min-h-[198px] content-start gap-[8px] overflow-hidden p-[18px] [&>h2]:m-0 [&>h2]:text-[19px] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:text-[12px] [&>p:not(.eyebrow)]:leading-[1.45] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:mt-[2px]! [&_.eyebrow]:mb-0! [&_.eyebrow]:text-[10px]!"
          >
            <span className="platform-icon grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#fff4da] text-[22px] text-gold">
              <Wallet className="ui-icon" />
            </span>
            <p className="eyebrow">SUBSCRIPTIONS</p>
            <h2>Owner Payments</h2>
            <p>Verify and approve payments.</p>
            {data.pendingSubscriptionPayments.length > 0 && (
              <small className={platformAttention}>
                {data.pendingSubscriptionPayments.length} awaiting approval
              </small>
            )}
          </Link>
          <Link
            href="/platform/directory"
            className="card relative grid min-h-[198px] content-start gap-[8px] overflow-hidden p-[18px] [&>h2]:m-0 [&>h2]:text-[19px] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:text-[12px] [&>p:not(.eyebrow)]:leading-[1.45] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:mt-[2px]! [&_.eyebrow]:mb-0! [&_.eyebrow]:text-[10px]!"
          >
            <span className="platform-icon grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#fff4da] text-[22px] text-gold">
              <CalendarDays className="ui-icon" />
            </span>
            <p className="eyebrow">CONFERENCES</p>
            <h2>Conference Directory</h2>
            <p>View conferences, divisions and players activity.</p>
          </Link>
          <Link
            href="/platform/announcements"
            className="card relative grid min-h-[198px] content-start gap-[8px] overflow-hidden p-[18px] [&>h2]:m-0 [&>h2]:text-[19px] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:text-[12px] [&>p:not(.eyebrow)]:leading-[1.45] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:mt-[2px]! [&_.eyebrow]:mb-0! [&_.eyebrow]:text-[10px]! border-[#08243e]! bg-[linear-gradient(135deg,#08243e,#0a3767)]! text-white! [&>p:not(.eyebrow)]:text-[#d6e2ed] [&_.eyebrow]:text-[#f6bf55] [&_.platform-icon]:bg-[rgba(245,163,19,0.18)] [&_.platform-icon]:text-[#f6bf55]"
          >
            <span className="platform-icon grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#fff4da] text-[22px] text-gold">
              <ClipboardList className="ui-icon" />
            </span>
            <p className="eyebrow">COMMUNICATION</p>
            <h2>Announcements</h2>
            <p>Send KCH-wide updates.</p>
          </Link>
          <Link
            href="/platform/support"
            className="card relative grid min-h-[198px] content-start gap-[8px] overflow-hidden p-[18px] [&>h2]:m-0 [&>h2]:text-[19px] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:text-[12px] [&>p:not(.eyebrow)]:leading-[1.45] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:mt-[2px]! [&_.eyebrow]:mb-0! [&_.eyebrow]:text-[10px]! border-[#08243e]! bg-[linear-gradient(135deg,#08243e,#0a3767)]! text-white! [&>p:not(.eyebrow)]:text-[#d6e2ed] [&_.eyebrow]:text-[#f6bf55] [&_.platform-icon]:bg-[rgba(245,163,19,0.18)] [&_.platform-icon]:text-[#f6bf55]"
          >
            <span className="platform-icon grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#fff4da] text-[22px] text-gold">
              ?
            </span>
            <p className="eyebrow">OWNER HELP</p>
            <h2>Support</h2>
            <p>Review owner requests.</p>
          </Link>
          <Link
            href="/platform/settings"
            className="card relative grid min-h-[198px] content-start gap-[8px] overflow-hidden p-[18px] [&>h2]:m-0 [&>h2]:text-[19px] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:text-[12px] [&>p:not(.eyebrow)]:leading-[1.45] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:mt-[2px]! [&_.eyebrow]:mb-0! [&_.eyebrow]:text-[10px]!"
          >
            <span className="platform-icon grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#fff4da] text-[22px] text-gold">
              <Settings className="ui-icon" />
            </span>
            <p className="eyebrow">PLATFORM</p>
            <h2>Settings</h2>
            <p>Manage platform defaults.</p>
          </Link>
        </nav>
      </main>
    </div>
  );
}
