import { ChevronRight, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import OwnerPageShell from "@/components/OwnerPageShell";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getOwnerPortalData } from "@/lib/owner-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function OwnerMorePage() {
  const [data, roles] = await Promise.all([getOwnerPortalData(), getAvailableRoles()]);
  if (!data.authorized) redirect("/owner");
  const pendingPayments = data.paymentSubmissions.filter(
    (submission) => submission.status === "pending",
  ).length;
  return (
    <OwnerPageShell
      title="More Tools"
      subtitle="Additional conference tasks and records."
      active="more"
      conferenceId={data.conferenceId}
      conferences={data.conferences}
    >
      <RoleSwitcher roles={roles} active="owner" />
      <nav className="owner-more-list" aria-label="More owner tools">
        <Link href="/owner/payments">
          <span>
            <Wallet className="ui-icon" />
          </span>
          <div>
            <b>Payments</b>
            <small>Review and confirm player payment notices</small>
          </div>
          {pendingPayments > 0 && <em>{pendingPayments}</em>}
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <Link href="/owner/financials">
          <span>
            <DollarSign className="ui-icon" />
          </span>
          <div>
            <b>Financial Summary</b>
            <small>Track season income, expenses, and profit or loss</small>
          </div>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
      </nav>
    </OwnerPageShell>
  );
}
