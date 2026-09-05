import { CalendarDays, ChevronRight, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SeasonInvitationCard from "@/components/SeasonInvitationCard";
import AvailabilityControl from "@/components/AvailabilityControl";
import { getPlayerPortalData } from "@/lib/kch-data";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const data = await getPlayerPortalData("home");
  const supabase = await createClient();
  const { data: requiredRules } = data.activeRegistrationId
    ? await supabase.rpc("get_registration_rules", { p_registration_id: data.activeRegistrationId })
    : { data: null };
  // A pending invitation must be reviewed first. Its Join action opens Rules &
  // Discipline only after the player has chosen to join.
  if (!data.invitation && requiredRules?.[0] && !requiredRules[0].acknowledged_at)
    redirect(`/rules?registration=${data.activeRegistrationId}`);
  const next = data.games[0];
  const firstName = data.profile.name.split(" ")[0];
  if (!data.contexts.length)
    return (
      <AppShell
        active="home"
        contexts={data.contexts}
        activeRegistrationId={data.activeRegistrationId}
        notifications={data.notifications}
        profileNeedsAttention={data.profileNeedsAttention}
        paymentNeedsAttention={data.paymentNeedsAttention}
        teamHasUnavailable={false}
      >
        <h1 className="title welcome">Hello, {firstName}!</h1>
        <p className="subtitle">Your KCH invitations appear here.</p>
        {data.invitation ? (
          <SeasonInvitationCard invitation={data.invitation} />
        ) : (
          <section className="card empty-feature">
            <span>🏀</span>
            <div>
              <p className="eyebrow">KCH</p>
              <h2>No active team yet</h2>
              <p>When a conference invites you, the invitation will appear here.</p>
            </div>
          </section>
        )}
      </AppShell>
    );
  return (
    <AppShell
      active="home"
      contexts={data.contexts}
      activeRegistrationId={data.activeRegistrationId}
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      conferenceName={data.context.conference}
    >
      <h1 className="title welcome">Hello, {firstName}!</h1>
      <p className="subtitle">Ready for game day?</p>
      {data.invitation && <SeasonInvitationCard invitation={data.invitation} />}
      {next ? (
        <>
          <section className="card feature-card">
            <div className="feature-copy">
              <p className="eyebrow">NEXT GAME</p>
              <p className="feature-date">{next.dateLabel}</p>
              <strong className="feature-time">{next.time}</strong>
            </div>
            <div className="matchup-logos">
              <div>
                <span className="team-mark">K</span>
                <b>{data.context.team}</b>
              </div>
              <strong className="versus">VS</strong>
              <div>
                <span className="team-mark opponent">
                  {next.opponent.slice(0, 2).toUpperCase()}
                </span>
                <b>{next.opponent}</b>
              </div>
            </div>
            <p className="feature-venue">
              <MapPin className="ui-icon" /> {next.venue}
              {next.court ? ` · ${next.court}` : ""}
            </p>
            <div className="uniform-line">
              <small>JERSEY COLOR</small>
              <span
                className={`uniform-dot ${next.uniform.toLowerCase().includes("dark") ? "dark" : "white"}`}
              />
              <b>{next.uniform.toUpperCase()}</b>
            </div>
          </section>
          <section className="card home-availability-card">
            <AvailabilityControl gameId={next.id} available={data.myAvailability} />
          </section>
        </>
      ) : (
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
      )}
      <Link className="card home-row" href="/my-team">
        <span className="roundel team-mark small">K</span>
        <span>
          <small>MY TEAM</small>
          <strong>{data.context.team}</strong>
          <em>
            {data.context.division} &nbsp;•&nbsp; {data.context.season}
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
          <strong>{data.context.season}</strong>
          <em>View schedule, standings, and results</em>
        </span>
        <b aria-hidden="true">
          <ChevronRight className="go-caret" />
        </b>
      </Link>
      {data.paymentAccount.balance > 0 && (
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
      <section className="family-banner">
        <strong>
          One Team.
          <br />
          One Court.
          <br />
          <span>One Family.</span>
        </strong>
      </section>
    </AppShell>
  );
}
