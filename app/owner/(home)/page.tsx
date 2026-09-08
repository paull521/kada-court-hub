import { Suspense, type ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Plus,
  User,
  Wallet,
} from "lucide-react";
import KchLogo from "@/components/KchLogo";
import Link from "next/link";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import OwnerConferenceSwitcher from "@/components/OwnerConferenceSwitcher";
import ConferencePlayerInvitation from "@/components/ConferencePlayerInvitation";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";
import { createClient } from "@/lib/supabase/server";
import { cx } from "@/components/ui/cx";
import { dashboardQuestion, ownerAccess } from "@/components/ui/shared-classes";

/**
 * One tile in the commissioner's grid.
 *
 * Seven of these differed only in icon, wording, destination and colour, and
 * carried six copies of the same class list between them. The variants are the
 * three the design actually has: a dark gradient for the two things a
 * commissioner does most, green for the money, plain for the rest.
 *
 * A square on the phone, a row on the laptop - which is the whole reason the
 * old rule needed `aspect-ratio: 1` in one file and `aspect-ratio: auto` in
 * another.
 */
const cardTone = {
  season: "border-[#123d68] bg-[linear-gradient(145deg,#082b50,#0e477c)] text-white",
  featured: "border-[#0b3966] bg-[linear-gradient(145deg,#082b50,#0e477c)] text-white",
  financial: "border-line bg-white/[0.94]",
  plain: "border-line bg-white/[0.94]",
} as const;

const iconTone = {
  season: "bg-white/[0.13] text-[#f5a313]",
  featured: "bg-white/[0.14] text-[#ffbd36]",
  financial: "bg-[#eaf6ec] text-green",
  plain: "bg-[#f7f0e4] text-gold",
} as const;

type Tone = keyof typeof cardTone;
const onDark = (tone: Tone) => tone === "season" || tone === "featured";

/** The red badge in a card's corner. Its ring matches the card behind it. */
function AttentionDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <i
      aria-label={label}
      className={cx(
        "absolute top-[13px] right-[13px] h-[10px] w-[10px] rounded-full border-2 bg-red shadow-[0_1px_5px_rgba(89,10,16,0.3)]",
        onDark(tone) ? "border-[#0d3d69]" : "border-white",
      )}
    />
  );
}

function ActionCard({
  href,
  icon,
  label,
  title,
  detail,
  dot,
  tone = "plain",
}: {
  href: string;
  icon: ReactNode;
  label: string;
  title: ReactNode;
  detail: ReactNode;
  dot?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "relative flex aspect-square min-h-0 flex-col items-start justify-between gap-[10px] rounded-[20px] border p-[15px] no-underline shadow-[0_8px_22px_rgba(13,38,69,0.08)] max-tiny:p-[12px]",
        "desk:aspect-auto desk:min-h-[124px] desk:flex-row desk:items-start desk:justify-start desk:gap-[14px] desk:p-[18px]",
        cardTone[tone],
      )}
    >
      <span
        className={cx(
          "mb-[2px] grid h-[48px] w-[48px] flex-none place-items-center rounded-[15px] text-[25px] max-tiny:h-[42px] max-tiny:w-[42px] max-tiny:text-[22px]",
          iconTone[tone],
        )}
      >
        {icon}
      </span>
      {dot}
      <div className="flex w-full flex-col items-start gap-[5px] desk:min-w-0 desk:flex-1">
        <small
          className={cx(
            "text-[12px] leading-[1.1] font-[800] tracking-normal max-tiny:text-[11px]",
            onDark(tone) ? "text-[#f6b33d]" : "text-[#b76b00]",
          )}
        >
          {label}
        </small>
        <b className="text-[18px] leading-[1.18] tracking-[-0.02em] max-tiny:text-[16px]">
          {title}
        </b>
        <p
          className={cx(
            "m-0 line-clamp-2 text-[13px] leading-[1.35] max-tiny:text-[12px]",
            onDark(tone) ? "text-[#d7e1ec]" : "text-[#637083]",
          )}
        >
          {detail}
        </p>
      </div>
    </Link>
  );
}

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
          {/* Not a link: this viewer is not a commissioner, so /owner would
              only return them to this same screen. The header already offers
              the way out. */}
          <KchLogo className="logo" />
          <Link href="/home" className="text-muted">
            Player View
          </Link>
        </header>
        <main className="content owner-content">
          <p className="eyebrow">COMMISSIONER</p>
          <h1 className="title">Conference Management</h1>
          <section className={`card ${ownerAccess}`}>
            <h2>Commissioner access required</h2>
            <p className="text-muted">
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
        <KchLogo className="logo" href="/owner" />
        <OwnerConferenceSwitcher
          conferences={context.conferences}
          currentId={context.conferenceId}
        />
      </header>
      <OwnerBottomNav active="home" />
      <main className="content owner-content owner-dashboard">
        <h1 className="title">
          {greeting},{" "}
          <span className="whitespace-nowrap max-[600px]:block">Mr.&nbsp;{lastName}!</span>
        </h1>
        <p className={dashboardQuestion}>What would you like to do?</p>
        {/* owner-action-grid carries no layout of its own any more - the two
            utilities below replaced it. It stays as the hook two children still
            reach for: the guide link and the invitation both take
            `grid-column: 1/-1` from a descendant rule on it, and lose their
            full width the moment it goes. It leaves when they are migrated. */}
        <nav
          className="owner-action-grid grid grid-cols-2 gap-[11px] desk:grid-cols-3 desk:gap-[16px]"
          aria-label="Conference commissioner actions"
        >
          <ActionCard
            href="/owner/setup"
            tone="season"
            icon={<Plus className="ui-icon" />}
            label="SEASON"
            title="Create Season Tournament"
            detail={
              <Suspense fallback={context.conferenceName}>
                <SeasonDetail conferenceName={context.conferenceName} />
              </Suspense>
            }
            dot={
              <Suspense fallback={null}>
                <SeasonDot />
              </Suspense>
            }
          />
          <ActionCard
            href="/owner/roster"
            icon={<User className="ui-icon" />}
            label="PLAYER DIRECTORY"
            title="Manage conference players"
            detail="Invite, assign and change roster."
            dot={
              <Suspense fallback={null}>
                <RosterRequestDot />
              </Suspense>
            }
          />
          <ActionCard
            href="/owner/schedule"
            icon={<CalendarDays className="ui-icon" />}
            label="SCHEDULE"
            title="View or update schedule"
            detail={
              <Suspense fallback="Loading schedule…">
                <ScheduleDetail />
              </Suspense>
            }
            dot={
              <Suspense fallback={null}>
                <ScheduleDot />
              </Suspense>
            }
          />
          <ActionCard
            href="/owner/scores"
            tone="featured"
            icon={<ClipboardList className="ui-icon" />}
            label="SCORES"
            title="Update game results"
            detail={
              <Suspense fallback="Checking completed games…">
                <ScoresDetail />
              </Suspense>
            }
            dot={
              <Suspense fallback={null}>
                <ScoresDot />
              </Suspense>
            }
          />
          <ActionCard
            href="/owner/payments"
            tone="featured"
            icon={<Wallet className="ui-icon" />}
            label="PAYMENTS"
            title={
              <Suspense fallback="Balances due">
                <BalancesDue />
              </Suspense>
            }
            detail="Review payments and balances."
            dot={
              <Suspense fallback={null}>
                <PaymentsDot />
              </Suspense>
            }
          />
          <ActionCard
            href="/owner/financials"
            tone="financial"
            icon={<DollarSign className="ui-icon" />}
            label="FINANCIAL SUMMARY"
            title="Track profit and loss"
            detail="Income and expense report."
          />
          <Link
            href="/owner/guide"
            className="col-span-full grid grid-cols-[42px_minmax(0,1fr)_18px] items-center gap-[12px] rounded-[16px] border border-[#ecd9b4] bg-[linear-gradient(135deg,#fff6e6,#fffdf8)] p-[13px_14px] desk:grid-cols-[48px_minmax(0,1fr)_18px] desk:p-[16px_18px]"
          >
            <span className="grid h-[42px] w-[42px] place-items-center rounded-[13px] bg-[rgba(209,132,8,0.13)] text-[#a76b06] desk:h-[48px] desk:w-[48px]">
              <BookOpen className="ui-icon" />
            </span>
            <div className="grid min-w-0 gap-[2px]">
              <b className="text-[15px] tracking-[-0.2px] desk:text-[16px]">Owner&apos;s Guide</b>
              <p className="m-0 text-[12px] leading-[1.35] text-[#7d6a48] desk:text-[13px]">
                Where each task lives and what it waits on.
              </p>
            </div>
            <strong aria-hidden="true" className="text-[#b98a2e]">
              <ChevronRight className="go-caret" />
            </strong>
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
    <AttentionDot tone="season" label="Season setup needs attention" />
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
    <AttentionDot tone="plain" label="Player Directory has roster requests waiting" />
  ) : null;
}

async function ScheduleDot() {
  return (await activeSetupSeason()) ? (
    <AttentionDot tone="plain" label="Schedule setup needs attention" />
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
    <AttentionDot tone="featured" label="Scores need attention" />
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
  return pending > 0 ? <AttentionDot tone="featured" label="Payments need attention" /> : null;
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
