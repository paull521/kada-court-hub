import { Suspense } from "react";
import { ChevronRight, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import OwnerPageShell from "@/components/OwnerPageShell";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";
import { getAvailableRoles } from "@/lib/roles";

/**
 * Everything here is static except the pending-payment count, which is the one
 * thing that needs the owner portal. The list renders immediately and the count
 * appears in place when it arrives, so a badge does not hold up two links and a
 * role switcher.
 */
export default async function OwnerMorePage() {
  const [context, roles] = await Promise.all([getOwnerConferenceContext(), getAvailableRoles()]);
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="More Tools"
      subtitle="Additional conference tasks and records."
      active="more"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
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
          <Suspense fallback={null}>
            <PendingPaymentCount />
          </Suspense>
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

async function PendingPaymentCount() {
  const data = await getOwnerPortalData();
  const pending = data.paymentSubmissions.filter(
    (submission) => submission.status === "pending",
  ).length;
  return pending > 0 ? <em>{pending}</em> : null;
}
