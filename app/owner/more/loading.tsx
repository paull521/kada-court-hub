import Link from "next/link";
import { ChevronRight, DollarSign, Wallet } from "lucide-react";
import OwnerShellFrame from "@/components/OwnerShellFrame";
import { moreList } from "@/components/ui/account-classes";

/**
 * Both links are fixed text, so this is the page apart from its role switcher -
 * drawn with nothing selected and nothing to press - and the pending-payment
 * count, which is the only read on it.
 */
export default function Loading() {
  return (
    <OwnerShellFrame
      title="More Tools"
      subtitle="Additional conference tasks and records."
      active="more"
    >
      <section className="card m-[16px_0] grid gap-[10px] p-4 [&>small]:font-[800] [&>small]:tracking-[0.08em] [&>small]:text-[#a85d00] [&>div]:relative [&>div]:grid [&>div]:auto-cols-fr [&>div]:grid-flow-col [&>div]:gap-[6px] [&>div]:rounded-[14px] [&>div]:bg-[#eef1f4] [&>div]:p-1">
        <small>VIEW AS</small>
        <div>
          <a>Player</a>
          <a>Captain</a>
          <a>Owner</a>
        </div>
      </section>
      <nav className={moreList} aria-label="More owner tools">
        <Link href="/owner/payments">
          <span>
            <Wallet className="ui-icon" />
          </span>
          <div>
            <b>Payments</b>
            <small>Review and confirm player payment notices</small>
          </div>
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
    </OwnerShellFrame>
  );
}
