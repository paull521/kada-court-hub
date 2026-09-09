import Link from "next/link";
import { CalendarDays, ChevronRight, Wallet } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import NextGameCard from "@/components/NextGameCard";
import SeasonInvitationCard from "@/components/SeasonInvitationCard";
import AvailabilityControl from "@/components/AvailabilityControl";
import type { PlayerPortalData } from "@/lib/kch-data";
import { availabilityControl } from "@/components/ui/account-classes";
import { emptyFeature, familyBanner } from "@/components/ui/shared-classes";

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
          <section className={`card ${emptyFeature}`}>
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
            <section className="card mt-[12px] mb-[14px] p-[18px]">
              {next && data ? (
                <AvailabilityControl gameId={next.id} available={data.myAvailability} />
              ) : (
                <section className={availabilityControl}>
                  <span>
                    <small>ARE YOU PLAYING?</small>
                  </span>
                  {/* Both answers are fixed words. The only thing the read
                      decides is which of them is filled, so the control is
                      drawn straight away with no pill on it and nothing to
                      press until the answer lands. */}
                  <div className="relative grid grid-cols-2 rounded-xl bg-[#eef1f4] p-1">
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
        <Link
          className={`card grid grid-cols-[72px_1fr_auto] items-center p-[18px] mb-[14px]`}
          href="/my-team"
        >
          <span className="m-auto grid h-[54px] w-[54px] place-items-center rounded-full border-4 border-[#f4a31b] bg-[#faf9f7] text-[23px] font-[900] text-[#f4a31b] outline-2 outline-red">
            K
          </span>
          <span className="grid gap-[4px]">
            <small className="m-0 text-[12px] text-gold">MY TEAM</small>
            <strong className="text-[22px]">
              {data ? data.context.team : <SkeletonText width="7.5em" />}
            </strong>
            <em className="text-[13px] text-muted not-italic">
              {data ? (
                <>
                  {data.context.division} &nbsp;•&nbsp; {data.context.season}
                </>
              ) : (
                <SkeletonText width="11em" />
              )}
            </em>
          </span>
          <b aria-hidden="true" className="text-[30px]">
            <ChevronRight className="go-caret" />
          </b>
        </Link>
        <Link
          className={`card grid grid-cols-[72px_1fr_auto] items-center p-[18px] mb-[14px]`}
          href="/schedule"
        >
          <span className="grid h-[58px] w-[58px] place-items-center rounded-full border border-line bg-[#faf9f7] text-[30px]">
            <CalendarDays className="ui-icon" />
          </span>
          <span className="grid min-w-0 gap-[4px]">
            <small className="m-0 text-[12px] text-gold">SCHEDULE</small>
            <strong className="text-[22px]">
              {data ? data.context.season : <SkeletonText width="8em" />}
            </strong>
            <em className="text-[13px] text-muted not-italic">
              View schedule, standings, and results
            </em>
          </span>
          <b aria-hidden="true" className="text-[30px]">
            <ChevronRight className="go-caret" />
          </b>
        </Link>
        {data && data.paymentAccount.balance > 0 && (
          <Link
            // border- and bg- have to shout: .card sets both unlayered.
            className="card mb-[14px] grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-[10px] border-[#edcf97]! bg-[#fffaf1]! p-[14px]"
            href="/payments"
          >
            <span className="grid h-[40px] w-[40px] place-items-center rounded-[12px] bg-[#fff1d5] text-[20px] text-[#a96700]">
              <Wallet className="ui-icon" />
            </span>
            <span className="grid gap-[3px]">
              <small className="text-[10px] font-[850] tracking-[0.06em] text-[#a96700]">
                PAYMENT DUE
              </small>
              <strong className="text-[15px]">
                ${data.paymentAccount.balance.toFixed(2)} remaining
              </strong>
              <em className="text-[11px] text-muted not-italic">
                Open Payments to submit or review your payment.
              </em>
            </span>
            <b aria-hidden="true" className="text-[25px]">
              <ChevronRight className="go-caret" />
            </b>
          </Link>
        )}
      </div>
      <section className={familyBanner}>
        <strong>
          One Team. One Court. <span>One Family.</span>
        </strong>
      </section>
    </>
  );
}
