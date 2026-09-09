import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { CalendarDays, Check, Users, Wallet } from "lucide-react";
import { LoadingNote } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";

/**
 * The captain's four tiles, written once and drawn twice: with the portal data,
 * and without it.
 *
 * The tile is a link, an icon and a fixed label - SCHEDULE, AVAILABILITY, TEAM
 * ROSTER, PAYMENTS - and none of that ever needed the read. Only the two lines
 * under each label do, and while they are on their way they are words rather
 * than grey bars, the way /owner does it: "Loading schedule…" reads as a tile
 * that is working, where a grey bar reads as a tile that is broken. The second
 * line says what the tile is about, which is true before the read and after it.
 *
 * The four values arrive together rather than one at a time as the owner's do,
 * because a tile carries a status modifier in its own className - the colour of
 * the tile is one of the things being read.
 */
/**
 * One tile in the captain's dashboard. Four of them, same shape: an icon, a
 * label, the figure that matters and a line under it.
 *
 * `!` on the two modifiers because .card is unlayered and sets its own border
 * and background - the old .attention and .featured rules beat it by sitting
 * later in the same file, which is a thing only source order was deciding.
 *
 * The last-child/odd rule makes a lone fourth tile span both columns on a
 * phone and stop doing so on a laptop. It counts elements, which is why the
 * announcement below lives outside the grid.
 */
const taskTile =
  "flex min-h-[150px] flex-col gap-[5px] p-[16px] last:odd:col-span-full last:odd:min-h-[125px] max-[620px]:min-h-[135px] max-[620px]:p-[13px] desk:min-h-[132px] desk:last:odd:col-auto desk:last:odd:min-h-[132px] [&>span]:text-[28px] [&_b]:text-[18px] max-[620px]:[&_b]:text-[16px] [&_em]:mt-auto [&_em]:text-[13px] [&_em]:not-italic [&_small]:font-[800]";
const tilePlain = "text-[#071b37]! [&_em]:text-[#637083] [&_small]:text-[#b76b00]";
const tileFeatured =
  "border-[#0c3c70]! bg-[linear-gradient(135deg,#08243e,#0c3c70)]! text-white! [&_em]:text-[#d7e1ec] [&_small]:text-[#f6b33d]";
const tileAttention = "border! border-[#e3a323]!";

function TaskTile({
  href,
  featured,
  attention,
  extra,
  children,
}: {
  href: string;
  featured?: boolean;
  attention?: boolean;
  /** Carried through unchanged: the roster tile appends its draft status. */
  extra?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "card",
        taskTile,
        featured ? tileFeatured : tilePlain,
        attention && tileAttention,
        extra,
      )}
    >
      {children}
    </Link>
  );
}

export default function CaptainDashboardFrame({ data }: { data?: CaptainPortalData }) {
  const next = data?.games[0];
  const noCount = data ? data.availability.filter((player) => !player.available).length : 0;
  const notPaid = data ? data.payments.filter((player) => player.balance > 0).length : 0;
  const rosterStatus = !data
    ? null
    : data.finalPublished
      ? "Final"
      : data.draftStatus === "changes_requested"
        ? "Changes requested"
        : data.draftStatus === "submitted"
          ? "Pending approval"
          : data.draftStatus === "approved"
            ? "Approved"
            : "Editing";
  return (
    // The announcement sits outside the grid. It is .sr-only so it takes no
    // space, but it is still an element, and .captain-task-tile:last-child:
    // nth-child(odd) counts elements: inside the grid it made Payments the
    // fifth child instead of the fourth, so the tile spanned both columns and
    // took the taller min-height until the read landed, then snapped back.
    <>
      {!data && <LoadingNote />}
      {/* captain-dashboard-grid keeps its class carrying no rule of its own:
          desktop.css asks the shell whether it :has() one, and gives the page
          the wide measure if it does. */}
      <section className="captain-dashboard-grid grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 max-[620px]:gap-[9px] desk:grid-cols-[repeat(4,minmax(0,1fr))] desk:gap-4">
        <TaskTile href="/captain/schedule" featured>
          <span>
            <CalendarDays className="ui-icon" />
          </span>
          <small>SCHEDULE</small>
          <b>{data ? (next ? next.dateLabel : "No game") : "Loading schedule…"}</b>
          <em>
            {data
              ? next
                ? `${next.time} · ${next.uniform}`
                : "Waiting for schedule"
              : "Next game and uniform"}
          </em>
        </TaskTile>
        <TaskTile href="/captain/availability" attention={noCount > 0}>
          <span>
            <Check className="ui-icon" />
          </span>
          <small>AVAILABILITY</small>
          <b>
            {data
              ? `${data.availability.length - noCount} Yes · ${noCount} No`
              : "Counting responses…"}
          </b>
          <em>{data ? (next ? `For ${next.opponent}` : "No upcoming game") : "Who is playing"}</em>
        </TaskTile>
        <TaskTile href="/captain/roster" extra={data ? data.draftStatus : undefined}>
          <span>
            <Users className="ui-icon" />
          </span>
          <small>TEAM ROSTER</small>
          <b>{rosterStatus ?? "Checking roster…"}</b>
          <em>{data ? `${data.roster.length} players` : "Draft and publication status"}</em>
        </TaskTile>
        <TaskTile href="/captain/payments" featured attention={notPaid > 0}>
          <span>
            <Wallet className="ui-icon" />
          </span>
          <small>PAYMENTS</small>
          <b>{data ? `${notPaid} balance${notPaid === 1 ? "" : "s"} due` : "Checking balances…"}</b>
          {/* Fixed - it says what the tile is, not what is in it. */}
          <em>Team payment status</em>
        </TaskTile>
      </section>
    </>
  );
}
