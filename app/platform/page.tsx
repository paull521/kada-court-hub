import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformDashboard } from "@/lib/platform-data";

export default async function PlatformCreatorPage() {
  const data = await getPlatformDashboard();
  if (!data.authorized) redirect("/platform/login");
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
        <Link href="/login" className="muted platform-signout">
          Player sign in
        </Link>
      </header>
      <main className="content owner-content platform-content">
        <p className="eyebrow">KCH PLATFORM CREATOR</p>
        <h1 className="title">Welcome, {data.adminName.split(" ")[0] || "Creator"}.</h1>
        <p className="owner-dashboard-question">Platform overview.</p>
        <nav className="platform-action-grid" aria-label="Platform creator actions">
          <Link href="/platform/owners" className="card platform-tile platform-primary">
            <span className="platform-icon">♙</span>
            <p className="eyebrow">OWNERS</p>
            <h2>Owner Management</h2>
            <p>Create and manage owner access.</p>
          </Link>
          <Link href="/platform/payments" className="card platform-tile">
            <span className="platform-icon">▣</span>
            <p className="eyebrow">SUBSCRIPTIONS</p>
            <h2>Owner Payments</h2>
            <p>Verify and approve payments.</p>
            {data.pendingSubscriptionPayments.length > 0 && (
              <small className="platform-attention">
                {data.pendingSubscriptionPayments.length} awaiting approval
              </small>
            )}
          </Link>
          <Link href="/platform/directory" className="card platform-tile">
            <span className="platform-icon">▦</span>
            <p className="eyebrow">CONFERENCES</p>
            <h2>Conference Directory</h2>
            <p>View conferences, divisions and players activity.</p>
          </Link>
          <Link href="/platform/announcements" className="card platform-tile platform-primary">
            <span className="platform-icon">⌁</span>
            <p className="eyebrow">COMMUNICATION</p>
            <h2>Announcements</h2>
            <p>Send KCH-wide updates.</p>
          </Link>
          <Link href="/platform/support" className="card platform-tile platform-primary">
            <span className="platform-icon">?</span>
            <p className="eyebrow">OWNER HELP</p>
            <h2>Support</h2>
            <p>Review owner requests.</p>
          </Link>
          <Link href="/platform/settings" className="card platform-tile">
            <span className="platform-icon">⚙</span>
            <p className="eyebrow">PLATFORM</p>
            <h2>Settings</h2>
            <p>Manage platform defaults.</p>
          </Link>
        </nav>
      </main>
    </div>
  );
}
