import "server-only";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSessionPlayer, getSessionUserId } from "@/lib/session";
import {
  currentContext,
  currentPlayer,
  fees,
  games,
  roster,
  type Fee,
  type Game,
  type GameResult,
  type Player,
  type PlayerView,
} from "@/lib/data";

export type PlayerContextOption = {
  registrationId: string;
  conferenceId: string;
  conference: string;
  season: string;
  divisionId: string;
  division: string;
  team: string;
  ownerName: string;
};
export type PlayerNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkPath: string;
  read: boolean;
  createdLabel: string;
};
export type PaymentSubmission = {
  id: string;
  registrationId: string;
  feeId: string;
  amount: number;
  method: "zelle" | "cash" | "waiver";
  status: "pending" | "confirmed" | "declined";
  reference: string;
  reviewNote: string;
  createdLabel: string;
};
export type PaymentHistoryItem = {
  id: string;
  feeLabel: string;
  amount: number;
  method: string;
  paidLabel: string;
};
export type PlayerAvailability = {
  registrationId: string;
  name: string;
  jerseyNumber: number | null;
  position: string;
  role: string;
  available: boolean;
  responded: boolean;
};
export type PlayerPaymentAccount = {
  totalCharges: number;
  paid: number;
  waived: number;
  pending: number;
  balance: number;
};
export type TeamLeader = { name: string; mobile: string };
export type DivisionRosterTeam = { id: string; name: string; isMyTeam: boolean; players: Player[] };
export type PlayerTeamInfo = {
  homeUniform: string;
  awayUniform: string;
  nextGameUniform: string;
  darkImage: string;
  lightImage: string;
  captain: TeamLeader;
  coCaptain: TeamLeader;
  rosterStage: "hidden" | "review" | "final";
  rosterReviewDeadline: string;
  divisionRosters: DivisionRosterTeam[];
};
export type NotificationPreferences = {
  gameUpdates: boolean;
  teamUpdates: boolean;
  paymentUpdates: boolean;
  seasonUpdates: boolean;
};
export type StandingRow = {
  teamId: string;
  team: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  difference: number;
  winPercentage: number;
  streak: string;
};
export type SeasonResult = {
  id: string;
  dateLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  court: string;
};
export type DivisionScheduleGame = {
  id: string;
  dateKey: string;
  dateLabel: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  court: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type PlayerPortalData = {
  context: typeof currentContext;
  contexts: PlayerContextOption[];
  activeRegistrationId: string;
  profile: PlayerView;
  roster: Player[];
  games: Game[];
  divisionSchedule: DivisionScheduleGame[];
  results: GameResult[];
  notifications: PlayerNotification[];
  requiresAttention: boolean;
  profileNeedsAttention: boolean;
  paymentNeedsAttention: boolean;
  paymentSubmissions: PaymentSubmission[];
  paymentHistory: PaymentHistoryItem[];
  availability: PlayerAvailability[];
  myAvailability: boolean;
  teamHasUnavailable: boolean;
  paymentAccount: PlayerPaymentAccount;
  teamInfo: PlayerTeamInfo;
  notificationPreferences: NotificationPreferences;
  standings: StandingRow[];
  seasonResults: SeasonResult[];
  fees: Fee[];
  invitation: {
    id: string;
    conferenceName: string;
    ownerName: string;
    seasonName: string;
    divisionName: string;
    startsOn: string;
    endsOn: string;
    leagueFee: number;
    uniformFee: number;
    message: string;
    response: "pending" | "joining" | "not_joining";
    responseDeadline: string;
    teamCount: number;
    playersPerTeam: number;
    invitedCount: number;
  } | null;
  source: "supabase" | "fallback";
};

const fallback: PlayerPortalData = {
  context: currentContext,
  contexts: [],
  activeRegistrationId: "",
  profile: currentPlayer,
  roster,
  games,
  divisionSchedule: [],
  results: [],
  notifications: [],
  requiresAttention: false,
  profileNeedsAttention: false,
  paymentNeedsAttention: false,
  paymentSubmissions: [],
  paymentHistory: [],
  availability: [],
  myAvailability: true,
  teamHasUnavailable: false,
  paymentAccount: {
    totalCharges: fees.reduce((sum, fee) => sum + fee.amount, 0),
    paid: 0,
    waived: 0,
    pending: 0,
    balance: fees.reduce((sum, fee) => sum + fee.amount, 0),
  },
  teamInfo: {
    homeUniform: "Dark / Navy",
    awayUniform: "White",
    nextGameUniform: "White",
    darkImage: "",
    lightImage: "",
    captain: { name: "Winston Keys", mobile: "" },
    coCaptain: { name: "Fritz Rigor", mobile: "" },
    rosterStage: "hidden",
    rosterReviewDeadline: "",
    divisionRosters: [],
  },
  notificationPreferences: {
    gameUpdates: true,
    teamUpdates: true,
    paymentUpdates: true,
    seasonUpdates: true,
  },
  standings: [],
  seasonResults: [],
  fees,
  invitation: null,
  source: "fallback",
};
const roleName = (value: string): Player["role"] =>
  value === "Captain" || value === "Co-captain" ? value : "Player";
const feeIcon = (category: string) =>
  category === "league" ? "◉" : category === "uniform" ? "♕" : "▣";
const playerFacingFees = (
  rows: Array<{ id: string; category: string; description: string; amount_cents: number }>,
): Fee[] => {
  const platformAmount = rows
    .filter((row) => row.category === "platform")
    .reduce((sum, row) => sum + row.amount_cents, 0);
  const visible = rows
    .filter((row) => row.category !== "platform")
    .map((row) => ({
      id: row.id,
      label: row.description,
      amount: row.amount_cents / 100,
      icon: feeIcon(row.category),
    }));
  if (platformAmount > 0) {
    const league = visible.find((fee) => fee.icon === "◉");
    if (league) league.amount += platformAmount / 100;
    else
      visible.push({
        id: "league-access",
        label: "League Fee",
        amount: platformAmount / 100,
        icon: "◉",
      });
  }
  return visible;
};
const rosterOrder = (left: Player, right: Player) => {
  const rank = (role: Player["role"]) => (role === "Captain" ? 0 : role === "Co-captain" ? 1 : 2);
  return (
    rank(left.role) - rank(right.role) ||
    (left.number || Number.MAX_SAFE_INTEGER) - (right.number || Number.MAX_SAFE_INTEGER) ||
    left.name.localeCompare(right.name)
  );
};

export async function getPlayerPortalData(
  scope: "full" | "home" | "payments" | "profile" = "full",
): Promise<PlayerPortalData> {
  await connection();
  try {
    const supabase = await createClient();
    const userId = await getSessionUserId();
    if (!userId) return fallback;

    const [{ data: profile }, player] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,display_name,mobile,birthdate,location")
        .eq("id", userId)
        .maybeSingle(),
      getSessionPlayer(),
    ]);
    if (!profile || !player) return fallback;

    const playerContextPromise = Promise.all([
      supabase
        .from("registrations")
        .select(
          "id,season_id,team_id,status,jersey_number,jersey_name,position,role_label,created_at",
        )
        .eq("player_id", player.id)
        .not("team_id", "is", null)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false }),
      supabase.rpc("get_player_context_owners"),
      supabase.rpc("get_my_conference_player_statuses"),
    ]);
    // Invitations are global to the player, not just the currently selected team.
    // This lets an active player respond to a new division invitation.
    const { data: pendingInvitationRow } = await supabase
      .from("season_invitations")
      .select("id,response,broadcast_id,season_id,division_id")
      .eq("player_id", player.id)
      .eq("response", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const [
      { data: pendingBroadcastRow },
      { data: pendingSeasonRow },
      { data: pendingDivisionRow },
    ] = pendingInvitationRow
      ? await Promise.all([
          supabase
            .from("season_broadcasts")
            .select("message,response_deadline,team_count,players_per_team,invited_count")
            .eq("id", pendingInvitationRow.broadcast_id)
            .maybeSingle(),
          supabase
            .from("seasons")
            .select("name,starts_on,ends_on,conference_id")
            .eq("id", pendingInvitationRow.season_id)
            .maybeSingle(),
          supabase
            .from("divisions")
            .select("name")
            .eq("id", pendingInvitationRow.division_id)
            .maybeSingle(),
        ])
      : [{ data: null }, { data: null }, { data: null }];
    const [
      { data: pendingConferenceRow },
      { data: pendingFinancialRow },
      { data: pendingOwnerRows },
    ] =
      pendingInvitationRow && pendingSeasonRow && pendingDivisionRow
        ? await Promise.all([
            supabase
              .from("conferences")
              .select("name")
              .eq("id", pendingSeasonRow.conference_id)
              .maybeSingle(),
            supabase
              .from("division_financial_settings")
              .select("league_fee_enabled,league_fee_cents,uniform_fee_enabled,uniform_fee_cents")
              .eq("division_id", pendingInvitationRow.division_id)
              .maybeSingle(),
            supabase
              .from("conference_memberships")
              .select("profiles(display_name)")
              .eq("conference_id", pendingSeasonRow.conference_id)
              .eq("role", "owner")
              .limit(1),
          ])
        : [{ data: null }, { data: null }, { data: null }];
    const ownerName =
      (pendingOwnerRows?.[0]?.profiles as unknown as { display_name?: string } | null)
        ?.display_name ?? "Conference Owner";
    const pendingInvitation =
      pendingInvitationRow && pendingBroadcastRow && pendingSeasonRow && pendingDivisionRow
        ? {
            id: pendingInvitationRow.id,
            conferenceName: pendingConferenceRow?.name ?? "Conference",
            ownerName,
            seasonName: pendingSeasonRow.name,
            divisionName: pendingDivisionRow.name,
            startsOn: pendingSeasonRow.starts_on ?? "",
            endsOn: pendingSeasonRow.ends_on ?? "",
            leagueFee:
              pendingFinancialRow?.league_fee_enabled === false
                ? 0
                : (pendingFinancialRow?.league_fee_cents ?? 0) / 100,
            uniformFee:
              pendingFinancialRow?.uniform_fee_enabled === false
                ? 0
                : (pendingFinancialRow?.uniform_fee_cents ?? 0) / 100,
            message: pendingBroadcastRow.message,
            response: "pending" as const,
            responseDeadline: pendingBroadcastRow.response_deadline ?? "",
            teamCount: pendingBroadcastRow.team_count ?? 0,
            playersPerTeam: pendingBroadcastRow.players_per_team ?? 0,
            invitedCount: pendingBroadcastRow.invited_count ?? 0,
          }
        : null;
    const playerProfile = {
      ...fallback.profile,
      id: player.public_player_id,
      name: profile.display_name,
      initials: profile.display_name
        .split(/\s+/)
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      status: pendingInvitation ? "Invitation pending" : "KCH Player",
      email: player.email ?? "",
      mobile: profile.mobile ?? "",
      birthdate: profile.birthdate
        ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
            new Date(`${profile.birthdate}T00:00:00Z`),
          )
        : "",
      birthdateValue: profile.birthdate ?? "",
      location: profile.location ?? "",
      jerseyNumber: 0,
      jerseyName: "",
      position: "",
      preferredPosition: player.preferred_position ?? "",
      uniformSize: player.preferred_uniform_size ?? "",
      role: "Player" as const,
    };

    const [{ data: registrationRows }, { data: contextOwnerRows }, { data: conferenceStatusRows }] =
      await playerContextPromise;
    if (!registrationRows?.length)
      return {
        ...fallback,
        profile: playerProfile,
        invitation: pendingInvitation,
        source: "supabase",
      };

    const registeredTeamIds = [
      ...new Set(registrationRows.flatMap((row) => (row.team_id ? [row.team_id] : []))),
    ];
    // One embedded read replaces the teams -> divisions -> seasons -> conferences
    // chain that previously cost four sequential round trips purely to resolve
    // foreign keys. PostgREST applies the same row-level security to embedded
    // tables as it does to standalone selects, so visibility is unchanged.
    type RegisteredTeamRow = {
      id: string;
      name: string;
      division_id: string;
      active: boolean;
      divisions: {
        id: string;
        name: string;
        season_id: string;
        seasons: {
          id: string;
          name: string;
          conference_id: string;
          starts_on: string;
          ends_on: string;
          canceled_at: string | null;
          archived_at: string | null;
          conferences: { id: string; name: string; timezone: string } | null;
        } | null;
      } | null;
    };
    const { data: registeredTeamRows } = registeredTeamIds.length
      ? await supabase
          .from("teams")
          .select(
            "id,name,division_id,active,divisions(id,name,season_id,seasons(id,name,conference_id,starts_on,ends_on,canceled_at,archived_at,conferences(id,name,timezone)))",
          )
          .in("id", registeredTeamIds)
      : { data: [] };
    const registeredTeams = (registeredTeamRows ?? []) as unknown as RegisteredTeamRow[];

    const teamMap = new Map(
      registeredTeams.map((row) => [
        row.id,
        { id: row.id, name: row.name, division_id: row.division_id, active: row.active },
      ]),
    );
    const divisionMap = new Map(
      registeredTeams.flatMap((row) =>
        row.divisions
          ? [
              [
                row.divisions.id,
                {
                  id: row.divisions.id,
                  name: row.divisions.name,
                  season_id: row.divisions.season_id,
                },
              ] as const,
            ]
          : [],
      ),
    );
    const seasonMap = new Map(
      registeredTeams.flatMap((row) => {
        const season = row.divisions?.seasons;
        return season
          ? [
              [
                season.id,
                {
                  id: season.id,
                  name: season.name,
                  conference_id: season.conference_id,
                  starts_on: season.starts_on,
                  ends_on: season.ends_on,
                  canceled_at: season.canceled_at,
                  archived_at: season.archived_at,
                },
              ] as const,
            ]
          : [];
      }),
    );
    const conferenceMap = new Map(
      registeredTeams.flatMap((row) => {
        const conference = row.divisions?.seasons?.conferences;
        return conference ? [[conference.id, conference] as const] : [];
      }),
    );

    const registeredSeasonIds = [...seasonMap.keys()];
    const { data: registeredGames } = registeredSeasonIds.length
      ? await supabase
          .from("games")
          .select("season_id,starts_at,status")
          .in("season_id", registeredSeasonIds)
          .neq("status", "canceled")
      : { data: [] };

    const lastGameBySeason = new Map<string, string>();
    for (const game of registeredGames ?? []) {
      const date = game.starts_at.slice(0, 10),
        previous = lastGameBySeason.get(game.season_id);
      if (!previous || date > previous) lastGameBySeason.set(game.season_id, date);
    }
    const conferenceStatus = new Map(
      (conferenceStatusRows ?? []).map((row: { conference_id: string; status: string }) => [
        row.conference_id,
        row.status,
      ]),
    );
    const ownerNameByRegistration = new Map<string, string>(
      (contextOwnerRows ?? []).map((row: { registration_id: string; owner_name: string }) => [
        row.registration_id,
        row.owner_name,
      ]),
    );
    const contexts: PlayerContextOption[] = registrationRows.flatMap((row) => {
      const contextTeam = row.team_id ? teamMap.get(row.team_id) : undefined;
      const contextDivision = contextTeam ? divisionMap.get(contextTeam.division_id) : undefined;
      const contextSeason = contextDivision ? seasonMap.get(contextDivision.season_id) : undefined;
      const contextConference = contextSeason
        ? conferenceMap.get(contextSeason.conference_id)
        : undefined;
      const today = new Date().toISOString().slice(0, 10),
        lastGame = contextSeason ? lastGameBySeason.get(contextSeason.id) : undefined,
        lastGameAccessThrough = lastGame ? new Date(`${lastGame}T00:00:00Z`) : null;
      if (lastGameAccessThrough)
        lastGameAccessThrough.setUTCDate(lastGameAccessThrough.getUTCDate() + 7);
      const gameAccessActive = lastGameAccessThrough
        ? lastGameAccessThrough.toISOString().slice(0, 10) >= today
        : false;
      return contextTeam?.active &&
        contextDivision &&
        contextSeason &&
        (contextSeason.ends_on >= today || gameAccessActive) &&
        !contextSeason.canceled_at &&
        !contextSeason.archived_at &&
        contextConference &&
        conferenceStatus.get(contextConference.id) === "active"
        ? [
            {
              registrationId: row.id,
              conferenceId: contextConference.id,
              conference: contextConference.name,
              season: contextSeason.name,
              divisionId: contextDivision.id,
              division: contextDivision.name,
              team: contextTeam.name,
              ownerName: ownerNameByRegistration.get(row.id) ?? "Conference Owner",
            },
          ]
        : [];
    });
    if (!contexts.length)
      return {
        ...fallback,
        profile: playerProfile,
        invitation: pendingInvitation,
        source: "supabase",
      };

    const requestedRegistrationId = (await cookies()).get("kch_active_registration")?.value;
    const activeContext =
      contexts.find((option) => option.registrationId === requestedRegistrationId) ?? contexts[0];
    const registration = registrationRows.find((row) => row.id === activeContext.registrationId)!;
    const team = teamMap.get(registration.team_id!)!;
    const division = divisionMap.get(team.division_id)!;
    const season = seasonMap.get(division.season_id)!;
    const conference = conferenceMap.get(season.conference_id)!;

    // The compact branch reads only what Home, Payments and Profile render. It
    // already covers fees, payments, waivers and submissions, so /payments
    // needs no extra query beyond the history projection below, and /profile
    // needs nothing extra at all. /my-team and /schedule still take the full
    // path because they need the roster and the whole-division schedule.
    if (scope !== "full") {
      const [
        { data: homeGameRows },
        { data: feeRows },
        { data: notificationRows },
        { data: submissionRows },
        { data: preferenceRow },
        { data: workflowRow },
        { data: paymentRows },
        { data: waiverRows },
      ] = await Promise.all([
        supabase
          .from("games")
          .select(
            "id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,home_score,away_score,status,home_team:teams!home_team_id(id,name),away_team:teams!away_team_id(id,name)",
          )
          .eq("season_id", season.id)
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .order("starts_at"),
        supabase
          .from("fees")
          .select("id,category,description,amount_cents,status")
          .eq("registration_id", registration.id),
        supabase
          .from("notifications")
          .select("id,notification_type,title,body,link_path,read_at,created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("payment_submissions")
          .select(
            "id,registration_id,fee_id,amount_cents,method,status,reference,review_note,created_at",
          )
          .eq("profile_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("notification_preferences")
          .select("game_updates,team_updates,payment_updates,season_updates")
          .eq("profile_id", userId)
          .maybeSingle(),
        supabase
          .from("division_schedule_workflows")
          .select("status")
          .eq("division_id", division.id)
          .maybeSingle(),
        supabase
          .from("payments")
          .select("id,registration_id,fee_id,amount_cents,method,paid_at")
          .eq("registration_id", registration.id)
          .order("paid_at", { ascending: false }),
        supabase
          .from("registration_waivers")
          .select("amount_cents")
          .eq("registration_id", registration.id),
      ]);
      // Team names ride along on the games read above rather than costing a
      // second round trip to resolve home_team_id / away_team_id.
      type NamedTeam = { id: string; name: string } | null;
      const homeTeamNames = new Map(
        ((homeGameRows ?? []) as unknown as { home_team: NamedTeam; away_team: NamedTeam }[])
          .flatMap((row) => [row.home_team, row.away_team])
          .flatMap((team) => (team ? [[team.id, team.name] as const] : [])),
      );
      const timezone = conference.timezone || "America/Los_Angeles",
        now = Date.now();
      const mappedHomeGames = (workflowRow?.status === "final" ? (homeGameRows ?? []) : [])
        .filter((row) => row.status !== "postponed" && row.status !== "canceled")
        .map((row) => {
          const date = new Date(row.starts_at),
            home = row.home_team_id === team.id,
            parts = new Intl.DateTimeFormat("en-US", {
              timeZone: timezone,
              weekday: "short",
              month: "short",
              day: "2-digit",
            }).formatToParts(date),
            get = (type: Intl.DateTimeFormatPartTypes) =>
              parts.find((part) => part.type === type)?.value ?? "";
          return {
            game: {
              id: row.id,
              day: get("weekday").toUpperCase(),
              month: get("month").toUpperCase(),
              date: get("day"),
              dateLabel: new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                weekday: "long",
                month: "short",
                day: "numeric",
              }).format(date),
              time: new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                hour: "numeric",
                minute: "2-digit",
              }).format(date),
              opponent: homeTeamNames.get(home ? row.away_team_id : row.home_team_id) ?? "Opponent",
              venue: row.venue,
              court: row.court ?? "",
              side: home ? "Home" : "Away",
              uniform: (home ? row.home_uniform : row.away_uniform) === "Dark" ? "Dark" : "White",
            } as Game,
            startsAt: date.getTime(),
            teamScore: home ? row.home_score : row.away_score,
            opponentScore: home ? row.away_score : row.home_score,
          };
        });
      const liveGames = mappedHomeGames
        .filter(
          (item) => item.teamScore === null && item.opponentScore === null && item.startsAt >= now,
        )
        .map((item) => item.game);
      const { data: availabilityRows } = liveGames[0]
        ? await supabase.rpc("get_team_game_availability", { p_game_id: liveGames[0].id })
        : { data: [] };
      const availability: PlayerAvailability[] = (availabilityRows ?? []).map(
        (row: {
          registration_id: string;
          player_name: string;
          jersey_number: number | null;
          player_position: string;
          role_label: string;
          available: boolean;
          responded: boolean;
        }) => ({
          registrationId: row.registration_id,
          name: row.player_name,
          jerseyNumber: row.jersey_number,
          position: row.player_position ?? "",
          role: row.role_label,
          available: row.available !== false,
          responded: Boolean(row.responded),
        }),
      );
      const liveFees = playerFacingFees(feeRows ?? []);
      const contextFeeIds = (feeRows ?? []).map((row) => row.id);
      const liveSubmissions: PaymentSubmission[] = (submissionRows ?? [])
        .filter(
          (row) => row.registration_id === registration.id || contextFeeIds.includes(row.fee_id),
        )
        .map((row) => ({
          id: row.id,
          registrationId: row.registration_id ?? registration.id,
          feeId: row.fee_id ?? "",
          amount: row.amount_cents / 100,
          method: row.method === "cash" ? "cash" : row.method === "waiver" ? "waiver" : "zelle",
          status:
            row.status === "confirmed"
              ? "confirmed"
              : row.status === "declined"
                ? "declined"
                : "pending",
          reference: row.reference ?? "",
          reviewNote: row.review_note ?? "",
          createdLabel: new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            dateStyle: "medium",
          }).format(new Date(row.created_at)),
        }));
      const notificationPreferences: NotificationPreferences = {
        gameUpdates: preferenceRow?.game_updates ?? true,
        teamUpdates: preferenceRow?.team_updates ?? true,
        paymentUpdates: preferenceRow?.payment_updates ?? true,
        seasonUpdates: preferenceRow?.season_updates ?? true,
      };
      const notificationEnabled = (type: string) =>
        type.startsWith("game_")
          ? notificationPreferences.gameUpdates
          : type.startsWith("payment_")
            ? notificationPreferences.paymentUpdates
            : type.includes("roster") || type.startsWith("team_")
              ? notificationPreferences.teamUpdates
              : notificationPreferences.seasonUpdates;
      const liveNotifications: PlayerNotification[] = (notificationRows ?? [])
        .filter(
          (row) =>
            notificationEnabled(row.notification_type) &&
            ["/home", "/payments", "/my-team", "/schedule", "/results", "/standings"].some((path) =>
              (row.link_path ?? "/home").startsWith(path),
            ),
        )
        .map((row) => ({
          id: row.id,
          type: row.notification_type,
          title: row.title,
          body: row.body,
          linkPath: row.link_path ?? "/home",
          read: Boolean(row.read_at),
          createdLabel: new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(row.created_at)),
        }));
      const totalCharges = (feeRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0) / 100,
        paid = (paymentRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0) / 100,
        waived = (waiverRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0) / 100,
        pending = liveSubmissions
          .filter((item) => item.status === "pending")
          .reduce((sum, item) => sum + item.amount, 0),
        paymentAccount: PlayerPaymentAccount = {
          totalCharges,
          paid,
          waived,
          pending,
          balance: Math.max(0, totalCharges - paid - waived),
        };
      const compactFeeLabels = new Map((feeRows ?? []).map((row) => [row.id, row.description]));
      const compactPaymentHistory: PaymentHistoryItem[] = (paymentRows ?? []).map((row) => ({
        id: row.id,
        feeLabel: compactFeeLabels.get(row.fee_id) ?? "Account payment",
        amount: row.amount_cents / 100,
        method: row.method,
        paidLabel: new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          dateStyle: "medium",
        }).format(new Date(row.paid_at)),
      }));
      return {
        ...fallback,
        context: {
          conference: conference.name,
          season: season.name,
          division: division.name,
          team: team.name,
        },
        contexts,
        activeRegistrationId: registration.id,
        profile: {
          ...playerProfile,
          jerseyNumber: registration.jersey_number ?? 0,
          jerseyName: registration.jersey_name ?? "",
          position: registration.position ?? "",
          role: roleName(registration.role_label),
        },
        games: liveGames,
        notifications: liveNotifications,
        profileNeedsAttention: !(
          profile.mobile &&
          profile.birthdate &&
          profile.location &&
          player.email &&
          player.preferred_position
        ),
        paymentNeedsAttention: paymentAccount.balance > 0 && paymentAccount.pending === 0,
        paymentSubmissions: liveSubmissions,
        availability,
        myAvailability:
          availability.find((item) => item.registrationId === registration.id)?.available ?? true,
        teamHasUnavailable: availability.some((item) => !item.available),
        paymentAccount,
        paymentHistory: compactPaymentHistory,
        notificationPreferences,
        fees: liveFees,
        invitation: pendingInvitation,
        source: "supabase",
      };
    }

    const [
      { data: registrations },
      { data: seasonGameRows },
      { data: divisionTeamRows },
      { data: feeRows },
      { data: notificationRows },
      { data: submissionRows },
      { data: uniformSettings },
      { data: leadershipRows },
      { data: preferenceRow },
      { data: rosterBroadcastRows },
      { data: scheduleWorkflowRow },
    ] = await Promise.all([
      supabase
        .from("registrations")
        .select(
          "player_id,jersey_number,jersey_name,position,role_label,player:player_profiles!player_id(id,display_name)",
        )
        .eq("team_id", team.id)
        .order("jersey_number"),
      supabase
        .from("games")
        .select(
          "id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,home_score,away_score,status,finalized_at,home_team:teams!home_team_id(id,name),away_team:teams!away_team_id(id,name)",
        )
        .eq("season_id", season.id)
        .order("starts_at"),
      supabase
        .from("teams")
        .select("id,name")
        .eq("division_id", division.id)
        .eq("active", true)
        .order("name"),
      supabase
        .from("fees")
        .select("id,category,description,amount_cents,status")
        .eq("registration_id", registration.id),
      supabase
        .from("notifications")
        .select("id,notification_type,title,body,link_path,read_at,created_at")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("payment_submissions")
        .select(
          "id,registration_id,fee_id,amount_cents,method,status,reference,review_note,created_at",
        )
        .eq("profile_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("division_uniform_settings")
        .select("dark_uniform,light_uniform,dark_image_path,light_image_path")
        .eq("division_id", division.id)
        .maybeSingle(),
      supabase.rpc("get_team_leadership", { p_team_id: team.id }),
      supabase
        .from("notification_preferences")
        .select("game_updates,team_updates,payment_updates,season_updates")
        .eq("profile_id", userId)
        .maybeSingle(),
      supabase
        .from("season_broadcasts")
        .select("broadcast_type,response_deadline")
        .eq("division_id", division.id)
        .in("broadcast_type", ["roster_draft", "roster_final"]),
      supabase
        .from("division_schedule_workflows")
        .select("status")
        .eq("division_id", division.id)
        .maybeSingle(),
    ]);

    // Display names arrive with the roster read above instead of a follow-up
    // lookup keyed on the player ids it just returned.
    const names = new Map(
      (
        (registrations ?? []) as unknown as {
          player: { id: string; display_name: string | null } | null;
        }[]
      ).flatMap((row) =>
        row.player ? [[row.player.id, row.player.display_name ?? "Unnamed Player"] as const] : [],
      ),
    );
    const liveRoster: Player[] = (registrations ?? [])
      .map((row) => ({
        id: row.player_id,
        number: row.jersey_number ?? 0,
        name: names.get(row.player_id) ?? "Unnamed Player",
        position: row.position ?? "",
        jerseyName: row.jersey_name ?? "",
        role: roleName(row.role_label),
      }))
      .sort(rosterOrder);
    const { data: publishedRosterRows } = await supabase.rpc("get_published_division_roster", {
      p_division_id: division.id,
    });
    const divisionRosters: DivisionRosterTeam[] = (divisionTeamRows ?? []).map((rosterTeam) => ({
      id: rosterTeam.id,
      name: rosterTeam.name,
      isMyTeam: rosterTeam.id === team.id,
      players: (publishedRosterRows ?? [])
        .filter((row: { team_id: string }) => row.team_id === rosterTeam.id)
        .map(
          (row: {
            registration_id: string;
            jersey_number: number | null;
            player_name: string;
            player_position: string;
            jersey_name: string | null;
            role_label: string;
          }) => ({
            id: row.registration_id,
            number: row.jersey_number ?? 0,
            name: row.player_name,
            position: row.player_position ?? "",
            jerseyName: row.jersey_name ?? "",
            role: roleName(row.role_label),
          }),
        )
        .sort(rosterOrder),
    }));

    // Same trick as the player's own games: names come back on the games read.
    type NamedSeasonTeam = { id: string; name: string } | null;
    const teamNames = new Map(
      (
        (seasonGameRows ?? []) as unknown as {
          home_team: NamedSeasonTeam;
          away_team: NamedSeasonTeam;
        }[]
      )
        .flatMap((row) => [row.home_team, row.away_team])
        .flatMap((team) => (team ? [[team.id, team.name] as const] : [])),
    );
    const timezone = conference.timezone || "America/Los_Angeles";
    const divisionTeamIds = new Set((divisionTeamRows ?? []).map((row) => row.id));
    const publishedDivisionGames =
      scheduleWorkflowRow?.status === "final"
        ? (seasonGameRows ?? []).filter(
            (row) =>
              divisionTeamIds.has(row.home_team_id) &&
              divisionTeamIds.has(row.away_team_id) &&
              row.status !== "postponed" &&
              row.status !== "canceled",
          )
        : [];
    const mappedGames = (scheduleWorkflowRow?.status === "final" ? (seasonGameRows ?? []) : [])
      .filter(
        (row) =>
          (row.home_team_id === team.id || row.away_team_id === team.id) &&
          row.status !== "postponed" &&
          row.status !== "canceled",
      )
      .map((row) => {
        const date = new Date(row.starts_at);
        const home = row.home_team_id === team.id;
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          weekday: "short",
          month: "short",
          day: "2-digit",
        }).formatToParts(date);
        const get = (type: Intl.DateTimeFormatPartTypes) =>
          parts.find((part) => part.type === type)?.value ?? "";
        const game: Game = {
          id: row.id,
          day: get("weekday").toUpperCase(),
          month: get("month").toUpperCase(),
          date: get("day"),
          dateLabel: new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            weekday: "long",
            month: "short",
            day: "numeric",
          }).format(date),
          time: new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            minute: "2-digit",
          }).format(date),
          opponent: teamNames.get(home ? row.away_team_id : row.home_team_id) ?? "Opponent",
          venue: row.venue,
          court: row.court ?? "",
          side: home ? "Home" : "Away",
          uniform: (home ? row.home_uniform : row.away_uniform) === "Dark" ? "Dark" : "White",
        };
        const teamScore = home ? row.home_score : row.away_score;
        const opponentScore = home ? row.away_score : row.home_score;
        return { game, startsAt: date.getTime(), teamScore, opponentScore };
      });
    const now = Date.now();
    const liveGames: Game[] = mappedGames
      .filter(
        (item) => item.teamScore === null && item.opponentScore === null && item.startsAt >= now,
      )
      .map((item) => item.game);
    const { data: availabilityRows } = liveGames[0]
      ? await supabase.rpc("get_team_game_availability", { p_game_id: liveGames[0].id })
      : { data: [] };
    const availability: PlayerAvailability[] = (availabilityRows ?? []).map(
      (row: {
        registration_id: string;
        player_name: string;
        jersey_number: number | null;
        player_position: string;
        role_label: string;
        available: boolean;
        responded: boolean;
      }) => ({
        registrationId: row.registration_id,
        name: row.player_name,
        jerseyNumber: row.jersey_number,
        position: row.player_position ?? "",
        role: row.role_label,
        available: row.available !== false,
        responded: Boolean(row.responded),
      }),
    );
    const myAvailability =
      availability.find((item) => item.registrationId === registration.id)?.available ?? true;
    const teamHasUnavailable = availability.some((item) => !item.available);
    const divisionSchedule: DivisionScheduleGame[] = publishedDivisionGames
      .filter(
        (row) =>
          (row.home_score !== null && row.away_score !== null) ||
          new Date(row.starts_at).getTime() >= now,
      )
      .map((row) => {
        const date = new Date(row.starts_at),
          parts = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).formatToParts(date),
          part = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((item) => item.type === type)?.value ?? "";
        return {
          id: row.id,
          dateKey: `${part("year")}-${part("month")}-${part("day")}`,
          dateLabel: new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(date),
          time: new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            minute: "2-digit",
          }).format(date),
          homeTeam: teamNames.get(row.home_team_id) ?? "Home Team",
          awayTeam: teamNames.get(row.away_team_id) ?? "Away Team",
          venue: row.venue,
          court: row.court ?? "",
          homeScore: row.home_score,
          awayScore: row.away_score,
        };
      });
    const liveResults: GameResult[] = mappedGames
      .filter((item) => item.teamScore !== null && item.opponentScore !== null)
      .sort((a, b) => b.startsAt - a.startsAt)
      .map((item) => ({
        ...item.game,
        teamScore: item.teamScore!,
        opponentScore: item.opponentScore!,
        outcome:
          item.teamScore! > item.opponentScore!
            ? "W"
            : item.teamScore! < item.opponentScore!
              ? "L"
              : "T",
      }));
    const finalDivisionGames = (
      scheduleWorkflowRow?.status === "final" ? (seasonGameRows ?? []) : []
    ).filter(
      (row) =>
        divisionTeamIds.has(row.home_team_id) &&
        divisionTeamIds.has(row.away_team_id) &&
        row.status !== "postponed" &&
        row.status !== "canceled" &&
        row.home_score !== null &&
        row.away_score !== null,
    );
    const standings: StandingRow[] = (divisionTeamRows ?? [])
      .map((standingTeam) => {
        const teamGames = finalDivisionGames.filter(
          (game) => game.home_team_id === standingTeam.id || game.away_team_id === standingTeam.id,
        );
        let wins = 0,
          losses = 0,
          ties = 0,
          pointsFor = 0,
          pointsAgainst = 0;
        const outcomes = teamGames.map((game) => {
          const home = game.home_team_id === standingTeam.id;
          const scored = home ? game.home_score! : game.away_score!;
          const allowed = home ? game.away_score! : game.home_score!;
          pointsFor += scored;
          pointsAgainst += allowed;
          if (scored > allowed) {
            wins++;
            return "W";
          }
          if (scored < allowed) {
            losses++;
            return "L";
          }
          ties++;
          return "T";
        });
        const latest = outcomes.at(-1);
        let streakCount = 0;
        for (let index = outcomes.length - 1; index >= 0 && outcomes[index] === latest; index--)
          streakCount++;
        return {
          teamId: standingTeam.id,
          team: standingTeam.name,
          played: teamGames.length,
          wins,
          losses,
          ties,
          pointsFor,
          pointsAgainst,
          difference: pointsFor - pointsAgainst,
          winPercentage: teamGames.length ? (wins + ties * 0.5) / teamGames.length : 0,
          streak: latest ? `${latest}${streakCount}` : "—",
        };
      })
      .sort(
        (a, b) =>
          b.winPercentage - a.winPercentage ||
          b.difference - a.difference ||
          b.pointsFor - a.pointsFor ||
          a.team.localeCompare(b.team),
      );
    const seasonResults: SeasonResult[] = finalDivisionGames
      .slice()
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      .slice(0, 20)
      .map((game) => ({
        id: game.id,
        dateLabel: new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          month: "short",
          day: "numeric",
        }).format(new Date(game.starts_at)),
        homeTeam: teamNames.get(game.home_team_id) ?? "Home Team",
        awayTeam: teamNames.get(game.away_team_id) ?? "Away Team",
        homeScore: game.home_score!,
        awayScore: game.away_score!,
        venue: game.venue,
        court: game.court ?? "",
      }));

    const contextFeeIds = (feeRows ?? []).map((row) => row.id);
    const liveFees = playerFacingFees(feeRows ?? []);
    const liveSubmissions: PaymentSubmission[] = (submissionRows ?? [])
      .filter(
        (row) => row.registration_id === registration.id || contextFeeIds.includes(row.fee_id),
      )
      .map((row) => ({
        id: row.id,
        registrationId: row.registration_id ?? registration.id,
        feeId: row.fee_id ?? "",
        amount: row.amount_cents / 100,
        method: row.method === "cash" ? "cash" : row.method === "waiver" ? "waiver" : "zelle",
        status:
          row.status === "confirmed"
            ? "confirmed"
            : row.status === "declined"
              ? "declined"
              : "pending",
        reference: row.reference ?? "",
        reviewNote: row.review_note ?? "",
        createdLabel: new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          dateStyle: "medium",
        }).format(new Date(row.created_at)),
      }));
    const [{ data: paymentRows }, { data: waiverRows }] = await Promise.all([
      supabase
        .from("payments")
        .select("id,registration_id,fee_id,amount_cents,method,paid_at")
        .eq("registration_id", registration.id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("registration_waivers")
        .select("amount_cents")
        .eq("registration_id", registration.id),
    ]);
    const feeLabels = new Map((feeRows ?? []).map((row) => [row.id, row.description]));
    const livePaymentHistory: PaymentHistoryItem[] = (paymentRows ?? []).map((row) => ({
      id: row.id,
      feeLabel: feeLabels.get(row.fee_id) ?? "Account payment",
      amount: row.amount_cents / 100,
      method: row.method,
      paidLabel: new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        dateStyle: "medium",
      }).format(new Date(row.paid_at)),
    }));
    const totalCharges = (feeRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0) / 100;
    const paid = (paymentRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0) / 100;
    const waived = (waiverRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0) / 100;
    const pending = liveSubmissions
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + item.amount, 0);
    const paymentAccount: PlayerPaymentAccount = {
      totalCharges,
      paid,
      waived,
      pending,
      balance: Math.max(0, totalCharges - paid - waived),
    };
    const notificationPreferences: NotificationPreferences = {
      gameUpdates: preferenceRow?.game_updates ?? true,
      teamUpdates: preferenceRow?.team_updates ?? true,
      paymentUpdates: preferenceRow?.payment_updates ?? true,
      seasonUpdates: preferenceRow?.season_updates ?? true,
    };
    const notificationEnabled = (type: string) =>
      type.startsWith("game_")
        ? notificationPreferences.gameUpdates
        : type.startsWith("payment_")
          ? notificationPreferences.paymentUpdates
          : type.includes("roster") || type.startsWith("team_")
            ? notificationPreferences.teamUpdates
            : notificationPreferences.seasonUpdates;
    const playerNotificationPaths = [
      "/home",
      "/payments",
      "/my-team",
      "/schedule",
      "/results",
      "/standings",
    ];
    const liveNotifications: PlayerNotification[] = (notificationRows ?? [])
      .filter(
        (row) =>
          notificationEnabled(row.notification_type) &&
          playerNotificationPaths.some((path) => (row.link_path ?? "/home").startsWith(path)),
      )
      .map((row) => ({
        id: row.id,
        type: row.notification_type,
        title: row.title,
        body: row.body,
        linkPath: row.link_path ?? "/home",
        read: Boolean(row.read_at),
        createdLabel: new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(row.created_at)),
      }));
    const profileNeedsCompletion = !(
      profile.mobile &&
      profile.birthdate &&
      profile.location &&
      player.email &&
      player.preferred_position
    );
    const paymentNeedsAttention = paymentAccount.balance > 0 && paymentAccount.pending === 0;
    const unreadActionAnnouncement = liveNotifications.some(
      (notification) =>
        !notification.read &&
        (/(^|_)(announcement|action|required)(_|$)/.test(notification.type) ||
          notification.type === "season_invitation"),
    );
    // The bell represents unread notifications only. Profile and payment tasks use their own menu dots.
    const requiresAttention = unreadActionAnnouncement;
    const captainRow = (leadershipRows ?? []).find(
      (row: { role_label: string; display_name: string | null; mobile: string | null }) =>
        row.role_label === "Captain",
    );
    const coCaptainRow = (leadershipRows ?? []).find(
      (row: { role_label: string; display_name: string | null; mobile: string | null }) =>
        row.role_label === "Co-captain",
    );
    const temporaryUniformTeam = team.name === "Trinity Travel [TEST]";
    const publicUniformUrl = (path: string | null | undefined) =>
      path ? supabase.storage.from("uniform-photos").getPublicUrl(path).data.publicUrl : "";
    const reviewBroadcast = (rosterBroadcastRows ?? []).find(
        (row) => row.broadcast_type === "roster_draft",
      ),
      finalBroadcast = (rosterBroadcastRows ?? []).find(
        (row) => row.broadcast_type === "roster_final",
      );
    const teamInfo: PlayerTeamInfo = {
      homeUniform: uniformSettings?.dark_uniform ?? "Dark / Navy",
      awayUniform: uniformSettings?.light_uniform ?? "White",
      nextGameUniform: liveGames[0]?.uniform ?? "Not assigned",
      darkImage:
        publicUniformUrl(uniformSettings?.dark_image_path) ||
        (temporaryUniformTeam ? "/uniforms/trinity-travel-test-dark.png" : ""),
      lightImage:
        publicUniformUrl(uniformSettings?.light_image_path) ||
        (temporaryUniformTeam ? "/uniforms/trinity-travel-test-light.png" : ""),
      captain: {
        name:
          captainRow?.display_name ??
          liveRoster.find((item) => item.role === "Captain")?.name ??
          "Unassigned",
        mobile: captainRow?.mobile ?? "",
      },
      coCaptain: {
        name:
          coCaptainRow?.display_name ??
          liveRoster.find((item) => item.role === "Co-captain")?.name ??
          "Unassigned",
        mobile: coCaptainRow?.mobile ?? "",
      },
      rosterStage: finalBroadcast ? "final" : reviewBroadcast ? "review" : "hidden",
      rosterReviewDeadline: reviewBroadcast?.response_deadline ?? "",
      divisionRosters,
    };
    // A response is final for the invitation card. Only a pending invitation belongs on Home.
    const invitation = pendingInvitation;
    const initials = profile.display_name
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return {
      context: {
        conference: conference.name,
        season: season.name,
        division: division.name,
        team: team.name,
      },
      contexts,
      activeRegistrationId: registration.id,
      profile: {
        id: player.public_player_id,
        name: profile.display_name,
        initials,
        status:
          registration.status === "active"
            ? "Active Player"
            : registration.status === "inactive"
              ? "Inactive"
              : "Pending",
        mobile: profile.mobile ?? "",
        email: player.email ?? "",
        birthdate: profile.birthdate
          ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
              new Date(`${profile.birthdate}T00:00:00Z`),
            )
          : "",
        birthdateValue: profile.birthdate ?? "",
        location: profile.location ?? "",
        jerseyNumber: registration.jersey_number ?? 0,
        jerseyName: registration.jersey_name ?? "",
        position: registration.position ?? "",
        preferredPosition: player.preferred_position ?? "",
        uniformSize: player.preferred_uniform_size ?? "",
        role: roleName(registration.role_label),
      },
      roster: liveRoster.length ? liveRoster : roster,
      games: liveGames,
      divisionSchedule,
      results: liveResults,
      notifications: liveNotifications,
      requiresAttention,
      profileNeedsAttention: profileNeedsCompletion,
      paymentNeedsAttention,
      paymentSubmissions: liveSubmissions,
      paymentHistory: livePaymentHistory,
      availability,
      myAvailability,
      teamHasUnavailable,
      paymentAccount,
      teamInfo,
      notificationPreferences,
      standings,
      seasonResults,
      fees: liveFees,
      invitation,
      source: "supabase",
    };
  } catch (error) {
    console.error("KCH live data fallback", error);
    return fallback;
  }
}
