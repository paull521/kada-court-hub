import Link from "next/link";
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
      <section className="captain-dashboard-grid">
        <Link href="/captain/schedule" className="card captain-task-tile featured">
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
        </Link>
        <Link
          href="/captain/availability"
          className={`card captain-task-tile ${noCount ? "attention" : ""}`}
        >
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
        </Link>
        <Link
          href="/captain/roster"
          className={`card captain-task-tile ${data ? data.draftStatus : ""}`.trim()}
        >
          <span>
            <Users className="ui-icon" />
          </span>
          <small>TEAM ROSTER</small>
          <b>{rosterStatus ?? "Checking roster…"}</b>
          <em>{data ? `${data.roster.length} players` : "Draft and publication status"}</em>
        </Link>
        <Link
          href="/captain/payments"
          className={`card captain-task-tile featured ${notPaid ? "attention" : ""}`}
        >
          <span>
            <Wallet className="ui-icon" />
          </span>
          <small>PAYMENTS</small>
          <b>{data ? `${notPaid} balance${notPaid === 1 ? "" : "s"} due` : "Checking balances…"}</b>
          {/* Fixed - it says what the tile is, not what is in it. */}
          <em>Team payment status</em>
        </Link>
      </section>
    </>
  );
}
