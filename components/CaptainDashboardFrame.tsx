import Link from "next/link";
import { CalendarDays, Check, Users, Wallet } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";

/**
 * The captain's four tiles, written once and drawn twice: with the portal data,
 * and without it.
 *
 * The tile is a link, an icon and a fixed label - SCHEDULE, AVAILABILITY, TEAM
 * ROSTER, PAYMENTS - and none of that ever needed the read. Only the two lines
 * of numbers under each label do.
 *
 * They used to stream as one block because a tile carries a status modifier in
 * its own className, so a tile drawn before its numbers arrive starts neutral
 * and can turn amber underneath the reader. That is the trade: four tiles that
 * are already the tiles, one of which may gain a colour, against four grey
 * squares that are not tiles at all.
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
    <section className="captain-dashboard-grid">
      {!data && <LoadingNote />}
      <Link href="/captain/schedule" className="card captain-task-tile featured">
        <span>
          <CalendarDays className="ui-icon" />
        </span>
        <small>SCHEDULE</small>
        <b>{data ? next ? next.dateLabel : "No game" : <SkeletonText width="7em" />}</b>
        <em>
          {data ? (
            next ? (
              `${next.time} · ${next.uniform}`
            ) : (
              "Waiting for schedule"
            )
          ) : (
            <SkeletonText width="9em" />
          )}
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
          {data ? (
            `${data.availability.length - noCount} Yes · ${noCount} No`
          ) : (
            <SkeletonText width="6em" />
          )}
        </b>
        <em>
          {data ? next ? `For ${next.opponent}` : "No upcoming game" : <SkeletonText width="8em" />}
        </em>
      </Link>
      <Link
        href="/captain/roster"
        className={`card captain-task-tile ${data ? data.draftStatus : ""}`.trim()}
      >
        <span>
          <Users className="ui-icon" />
        </span>
        <small>TEAM ROSTER</small>
        <b>{rosterStatus ?? <SkeletonText width="5em" />}</b>
        <em>{data ? `${data.roster.length} players` : <SkeletonText width="5em" />}</em>
      </Link>
      <Link
        href="/captain/payments"
        className={`card captain-task-tile featured ${notPaid ? "attention" : ""}`}
      >
        <span>
          <Wallet className="ui-icon" />
        </span>
        <small>PAYMENTS</small>
        <b>
          {data ? (
            `${notPaid} balance${notPaid === 1 ? "" : "s"} due`
          ) : (
            <SkeletonText width="7em" />
          )}
        </b>
        {/* Fixed - it says what the tile is, not what is in it. */}
        <em>Team payment status</em>
      </Link>
    </section>
  );
}
