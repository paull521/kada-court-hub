import { Suspense } from "react";
import { CalendarDays, ClipboardList, DollarSign, Plus, User, Wallet } from "lucide-react";
import KchLogo from "@/components/KchLogo";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import OwnerConferenceSwitcher from "@/components/OwnerConferenceSwitcher";
import ConferencePlayerInvitation from "@/components/ConferencePlayerInvitation";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";
import { createClient } from "@/lib/supabase/server";

/**
 * The landing page after a role switch, and the slowest thing about becoming an
 * owner. Every card here has a fixed icon, title and destination; only the
 * badge dots and the one-line counts underneath them come from the owner
 * portal. So the page awaits just the conference context, paints the whole grid
 * as working links, and streams each count into place as it arrives - the
 * commissioner can tap through to Schedule or Payments before the numbers land.
 */
export default async function Owner() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized)
    return (
      <div className="shell owner-shell">
        <header className="topbar">
          <KchLogo className="logo" />
          <Link href="/home" className="muted">
            Player View
          </Link>
        </header>
        <main className="content owner-content">
          <p className="eyebrow">COMMISSIONER</p>
          <h1 className="title">Conference Management</h1>
          <section className="card owner-access">
            <h2>Commissioner access required</h2>
            <p className="muted">
              This area is available only to a conference commissioner. Ask the current commissioner
              to add the commissioner role to your conference membership.
            </p>
            <Link href="/home" className="btn primary">
              Return to Player View
            </Link>
          </section>
        </main>
      </div>
    );
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: context.timezone,
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "hour")?.value ?? 0,
  );
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good night";
  const lastName = context.ownerName.trim().split(/\s+/).at(-1) ?? "Owner";
  return (
    <div className="shell owner-shell guided-owner-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <OwnerConferenceSwitcher
          conferences={context.conferences}
          currentId={context.conferenceId}
        />
      </header>
      <OwnerBottomNav active="home" />
      <main className="content owner-content owner-dashboard">
        <h1 className="title">
          {greeting}, <span className="owner-greeting-name">Mr.&nbsp;{lastName}!</span>
        </h1>
        <p className="owner-dashboard-question">What would you like to do?</p>
        <nav className="owner-action-grid" aria-label="Conference commissioner actions">
          <Link href="/owner/setup" className="owner-action-card season-action">
            <span className="owner-action-icon">
              <Plus className="ui-icon" />
            </span>
            <Suspense fallback={null}>
              <SeasonDot />
            </Suspense>
            <div>
              <small>SEASON</small>
              <b>Create Season Tournament</b>
              <p>
                <Suspense fallback={context.conferenceName}>
                  <SeasonDetail conferenceName={context.conferenceName} />
                </Suspense>
              </p>
            </div>
          </Link>
          <Link href="/owner/roster" className="owner-action-card">
            <span className="owner-action-icon">
              <User className="ui-icon" />
            </span>
            <Suspense fallback={null}>
              <RosterRequestDot />
            </Suspense>
            <div>
              <small>PLAYER DIRECTORY</small>
              <b>Manage conference players</b>
              <p>Invite, assign and change roster.</p>
            </div>
          </Link>
          <Link href="/owner/schedule" className="owner-action-card">
            <span className="owner-action-icon">
              <CalendarDays className="ui-icon" />
            </span>
            <Suspense fallback={null}>
              <ScheduleDot />
            </Suspense>
            <div>
              <small>SCHEDULE</small>
              <b>View or update schedule</b>
              <p>
                <Suspense fallback="Loading schedule…">
                  <ScheduleDetail />
                </Suspense>
              </p>
            </div>
          </Link>
          <Link href="/owner/scores" className="owner-action-card owner-featured-action">
            <span className="owner-action-icon">
              <ClipboardList className="ui-icon" />
            </span>
            <Suspense fallback={null}>
              <ScoresDot />
            </Suspense>
            <div>
              <small>SCORES</small>
              <b>Update game results</b>
              <p>
                <Suspense fallback="Checking completed games…">
                  <ScoresDetail />
                </Suspense>
              </p>
            </div>
          </Link>
          <Link href="/owner/payments" className="owner-action-card owner-featured-action">
            <span className="owner-action-icon">
              <Wallet className="ui-icon" />
            </span>
            <Suspense fallback={null}>
              <PaymentsDot />
            </Suspense>
            <div>
              <small>PAYMENTS</small>
              <b>
                <Suspense fallback="Balances due">
                  <BalancesDue />
                </Suspense>
              </b>
              <p>Review payments and balances.</p>
            </div>
          </Link>
          <Link href="/owner/financials" className="owner-action-card financial-action">
            <span className="owner-action-icon">
              <DollarSign className="ui-icon" />
            </span>
            <div>
              <small>FINANCIAL SUMMARY</small>
              <b>Track profit and loss</b>
              <p>Income and expense report.</p>
            </div>
          </Link>
          <Suspense fallback={null}>
            <ConferenceInvitation conferenceId={context.conferenceId} />
          </Suspense>
        </nav>
      </main>
    </div>
  );
}

/**
 * The setup step the active season is on. getOwnerPortalData() is memoised for
 * the request, so every slot below shares one read of it.
 */
const activeSetupSeason = async () => {
  const data = await getOwnerPortalData();
  return data.seasons.find((season) => !season.canceledAt && season.setupStage < 7) ?? null;
};

const setupStepNames = [
  "Create Season",
  "Add Divisions",
  "Add Teams",
  "Assign Captains",
  "Fees & Uniforms",
  "Invite Players",
  "Draft Rosters",
  "Build Schedule",
];

async function SeasonDot() {
  return (await activeSetupSeason()) ? (
    <i className="owner-action-dot" aria-label="Season setup needs attention" />
  ) : null;
}

async function SeasonDetail({ conferenceName }: { conferenceName: string }) {
  const activeSeason = await activeSetupSeason();
  if (!activeSeason) return conferenceName;
  const step =
    activeSeason.setupStage <= 3
      ? activeSeason.setupStage + 1
      : activeSeason.setupStage === 4
        ? activeSeason.preseasonReady
          ? 6
          : 5
        : activeSeason.setupStage === 5
          ? 7
          : 8;
  return `${conferenceName} · Step ${step} — ${setupStepNames[step - 1]}`;
}

async function RosterRequestDot() {
  const data = await getOwnerPortalData();
  const pending = data.rosterRequests.filter((request) => request.status === "pending").length;
  return pending > 0 ? (
    <i className="owner-action-dot" aria-label="Player Directory has roster requests waiting" />
  ) : null;
}

async function ScheduleDot() {
  return (await activeSetupSeason()) ? (
    <i className="owner-action-dot" aria-label="Schedule setup needs attention" />
  ) : null;
}

async function ScheduleDetail() {
  const data = await getOwnerPortalData();
  const games = data.seasons
    .filter((season) => !season.canceledAt)
    .flatMap((season) => season.games);
  return games.length
    ? `${games.length} total scheduled game${games.length === 1 ? "" : "s"}`
    : "No schedule has been created yet";
}

const missingScoreCount = async () => {
  const data = await getOwnerPortalData();
  return data.seasons
    .filter((season) => !season.canceledAt && season.setupStage >= 7)
    .flatMap((season) => season.games)
    .filter(
      (game) =>
        game.status === "scheduled" &&
        new Date(game.startsAt) <= new Date() &&
        (game.homeScore === null || game.awayScore === null),
    ).length;
};

async function ScoresDot() {
  return (await missingScoreCount()) > 0 ? (
    <i className="owner-action-dot" aria-label="Scores need attention" />
  ) : null;
}

async function ScoresDetail() {
  const missingScores = await missingScoreCount();
  return missingScores
    ? `${missingScores} completed game${missingScores === 1 ? "" : "s"} need results`
    : "No completed games are awaiting scores";
}

async function PaymentsDot() {
  const data = await getOwnerPortalData();
  const pending = data.paymentSubmissions.filter(
    (submission) => submission.status === "pending",
  ).length;
  return pending > 0 ? (
    <i className="owner-action-dot" aria-label="Payments need attention" />
  ) : null;
}

async function BalancesDue() {
  const data = await getOwnerPortalData();
  const balancesDue = data.paymentGroups
    .flatMap((group) => group.players)
    .filter((player) => player.due > 0).length;
  return `${balancesDue} balance${balancesDue === 1 ? "" : "s"} due`;
}

async function ConferenceInvitation({ conferenceId }: { conferenceId: string }) {
  const supabase = await createClient();
  const { data: token } = await supabase.rpc("owner_get_conference_player_invitation_token", {
    p_conference_id: conferenceId,
  });
  return typeof token === "string" ? <ConferencePlayerInvitation token={token} /> : null;
}
