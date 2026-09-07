import Link from "next/link";
import { CalendarDays, ChevronRight, Wallet } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import NextGameCard from "@/components/NextGameCard";
import SeasonInvitationCard from "@/components/SeasonInvitationCard";
import AvailabilityControl from "@/components/AvailabilityControl";
import type { PlayerPortalData } from "@/lib/kch-data";

/**
 * Home, written once and drawn twice: with the portal data, and without it.
 *
 * Without it the frame is the same frame. Every heading, label, icon and fixed
 * word is on screen from the first paint, because none of it ever needed the
 * read; only the values are grey, in the place and at the size of the text they
 * stand in for. /home blocks on its read on purpose - the rules redirect needs
 * activeRegistrationId before anything can be shown - so the page renders this
 * with the data and app/home/loading.tsx renders the same component without it.
 * One component either side of the wait, so it cannot change shape across it.
 */
export default function HomeFrame({ data }: { data?: PlayerPortalData }) {
  const next = data?.games[0];
  const firstName = data?.profile.name.split(" ")[0];
  return (
    <>
      {!data && <LoadingNote />}
      {/* No placeholder for the name: a grey bar in a 42px greeting is the
          loudest thing on the page. The word is there from the first paint and
          the name joins it. */}
      <h1 className="title welcome">Hello{firstName ? `, ${firstName}` : ""}!</h1>
      <p className="subtitle">Ready for game day?</p>
      <div className="col-pane col-pane-a">
        {data?.invitation && <SeasonInvitationCard invitation={data.invitation} />}
        {data && !next ? (
          <section className="card empty-feature">
            <span>
              <CalendarDays className="ui-icon" />
            </span>
            <div>
              <p className="eyebrow">SCHEDULE</p>
              <h2>No upcoming game yet</h2>
              <p>Your conference owner will publish the next game here.</p>
            </div>
          </section>
        ) : (
          <>
            <NextGameCard game={next} teamName={data?.context.team} />
            <section className="card home-availability-card">
              {next && data ? (
                <AvailabilityControl gameId={next.id} available={data.myAvailability} />
              ) : (
                <section className="availability-control">
                  <span>
                    <small>ARE YOU PLAYING?</small>
                  </span>
                  {/* Both answers are fixed words. The only thing the read
                      decides is which of them is filled, so the control is
                      drawn straight away with no pill on it and nothing to
                      press until the answer lands. */}
                  <div className="availability-choice">
                    <button type="button" disabled>
                      Yes
                    </button>
                    <button type="button" disabled>
                      No
                    </button>
                  </div>
                </section>
              )}
            </section>
          </>
        )}
      </div>
      <div className="col-pane col-pane-b">
        <Link className="card home-row" href="/my-team">
          <span className="roundel team-mark small">K</span>
          <span>
            <small>MY TEAM</small>
            <strong>{data ? data.context.team : <SkeletonText width="8em" />}</strong>
            <em>
              {data ? (
                <>
                  {data.context.division} &nbsp;•&nbsp; {data.context.season}
                </>
              ) : (
                <SkeletonText width="11em" />
              )}
            </em>
          </span>
          <b aria-hidden="true">
            <ChevronRight className="go-caret" />
          </b>
        </Link>
        <Link className="card home-row season-home-row" href="/schedule">
          <span className="roundel">
            <CalendarDays className="ui-icon" />
          </span>
          <span>
            <small>SCHEDULE</small>
            <strong>{data ? data.context.season : <SkeletonText width="8em" />}</strong>
            <em>View schedule, standings, and results</em>
          </span>
          <b aria-hidden="true">
            <ChevronRight className="go-caret" />
          </b>
        </Link>
        {data && data.paymentAccount.balance > 0 && (
          <Link className="card home-payment-reminder" href="/payments">
            <span>
              <Wallet className="ui-icon" />
            </span>
            <span>
              <small>PAYMENT DUE</small>
              <strong>${data.paymentAccount.balance.toFixed(2)} remaining</strong>
              <em>Open Payments to submit or review your payment.</em>
            </span>
            <b aria-hidden="true">
              <ChevronRight className="go-caret" />
            </b>
          </Link>
        )}
      </div>
      <section className="family-banner">
        <strong>
          One Team. One Court. <span>One Family.</span>
        </strong>
      </section>
    </>
  );
}
