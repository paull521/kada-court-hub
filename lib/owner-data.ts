import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/session";

export type OwnerRosterPlayer = {
  playerId: string;
  registrationId: string;
  publicPlayerId: string;
  name: string;
  email: string;
  mobile: string;
  uniformSize: string;
  jerseyNumber: number | null;
  position: string;
  role: string;
  status: "pending" | "active" | "inactive";
  claimed: boolean;
};
export type OwnerTeam = {
  id: string;
  name: string;
  active: boolean;
  players: OwnerRosterPlayer[];
  captain: string;
  coCaptain: string;
  homeUniform: string;
  awayUniform: string;
  draftStatus: "editing" | "submitted" | "approved" | "changes_requested";
  draftOwnerNote: string;
};
export type OwnerUnassignedPlayer = {
  registrationId: string;
  publicPlayerId: string;
  name: string;
};
export type OwnerDivision = {
  id: string;
  name: string;
  darkUniform: string;
  lightUniform: string;
  darkImage: string;
  lightImage: string;
  preseasonConfigured: boolean;
  leagueFeeEnabled: boolean;
  leagueFee: number | null;
  uniformFeeEnabled: boolean;
  uniformFee: number | null;
  invitationSent: boolean;
  invitationCount: number;
  invitationDeadline: string;
  invitationFlyer: string;
  rosterPublished: boolean;
  rosterReviewDeadline: string;
  rosterFinalPublished: boolean;
  scheduleMode: "" | "manual" | "kch";
  scheduleStatus: "not_started" | "draft" | "final";
  unassignedPlayers: OwnerUnassignedPlayer[];
  teams: OwnerTeam[];
};
export type OwnerInvitee = {
  invitationId: string;
  divisionId: string;
  registrationId: string;
  publicPlayerId: string;
  name: string;
  email: string;
  mobile: string;
  response: "pending" | "joining" | "not_joining";
  selectionStatus: "awaiting_response" | "eligible" | "waitlisted" | "declined";
  teamId: string;
  jerseyNumber: number | null;
  position: string;
};
export type OwnerGame = {
  id: string;
  divisionId: string;
  homeTeamId: string;
  homeTeam: string;
  awayTeamId: string;
  awayTeam: string;
  startsAt: string;
  localStartsAt: string;
  venue: string;
  court: string;
  durationMinutes?: number;
  homeUniform: string;
  awayUniform: string;
  homeScore: number | null;
  awayScore: number | null;
  draftHomeScore: number | null;
  draftAwayScore: number | null;
  finalized: boolean;
  phase: "regular" | "playoff";
  status: "scheduled" | "postponed" | "canceled";
  statusReason: string;
};
export type OwnerSeason = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  registrationOpen: boolean;
  playersPerTeam: number | null;
  setupStage: number;
  preseasonReady: boolean;
  canceledAt: string;
  cancelReason: string;
  divisions: OwnerDivision[];
  invitees: OwnerInvitee[];
  games: OwnerGame[];
};
export type OwnerPaymentSubmission = {
  id: string;
  playerName: string;
  feeLabel: string;
  amount: number;
  method: string;
  reference: string;
  status: "pending" | "confirmed" | "declined";
  seasonName: string;
  teamName: string;
  createdLabel: string;
};
export type OwnerPlayerPayment = {
  registrationId: string;
  playerName: string;
  teamName: string;
  assessed: number;
  received: number;
  due: number;
  waived: number;
  methods: string[];
  pendingReview: boolean;
  status: "Paid" | "Due" | "Waived" | "Mixed";
};
export type OwnerPaymentGroup = {
  seasonId: string;
  seasonName: string;
  divisionId: string;
  divisionName: string;
  leagueFee: number;
  uniformFee: number;
  platformFee: number;
  perPlayerTotal: number;
  totalPlayers: number;
  paidPlayers: number;
  unpaidPlayers: number;
  waivedPlayers: number;
  cashPlayers: number;
  zellePlayers: number;
  assessed: number;
  received: number;
  due: number;
  waived: number;
  cashReceived: number;
  zelleReceived: number;
  leagueReceived: number;
  uniformReceived: number;
  platformReceived: number;
  paymentCount: number;
  pendingCount: number;
  players: OwnerPlayerPayment[];
};
export type OwnerSeasonFinancial = {
  seasonId: string;
  courtCost: number;
  refereeCost: number;
  uniformCost: number;
  leagueCost: number;
  notes: string;
};
export type OwnerDirectoryPlayer = {
  id: string;
  publicPlayerId: string;
  name: string;
  email: string;
  mobile: string;
  seasonsJoined: number;
  divisionsJoined: number;
  playingThisSeason: boolean;
  status: "active" | "suspended" | "inactive";
  claimed: boolean;
};
export type OwnerRosterRequest = {
  id: string;
  seasonName: string;
  teamName: string;
  type: string;
  details: string;
  status: string;
  ownerNote: string;
  createdAt: string;
};
export type OwnerConferenceOption = { id: string; name: string };
export type OwnerPortalData = {
  authorized: boolean;
  conferenceId: string;
  conferenceName: string;
  conferences: OwnerConferenceOption[];
  directory: OwnerDirectoryPlayer[];
  ownerName: string;
  timezone: string;
  seasons: OwnerSeason[];
  paymentSubmissions: OwnerPaymentSubmission[];
  paymentGroups: OwnerPaymentGroup[];
  financials: OwnerSeasonFinancial[];
  rosterRequests: OwnerRosterRequest[];
};

const empty: OwnerPortalData = {
  authorized: false,
  conferenceId: "",
  conferenceName: "",
  conferences: [],
  directory: [],
  ownerName: "",
  timezone: "America/Los_Angeles",
  seasons: [],
  paymentSubmissions: [],
  paymentGroups: [],
  financials: [],
  rosterRequests: [],
};

/**
 * Which conference this owner is looking at, and what else they could switch
 * to. This is the first wave of getOwnerPortalData(), lifted out on its own
 * because several callers need only this much: the conference switcher in the
 * header, /owner/conferences, and getOwnerPaymentBilling(), which takes a
 * conference id and nothing else.
 *
 * cache() is React's request-scoped memo, so a page that calls both this and
 * getOwnerPortalData() still pays for the reads once. It lives for a single
 * render pass and is never shared between requests or between viewers, which
 * is what makes it safe for RLS-scoped data - see lib/session.ts.
 */
export type OwnerConferenceContext = {
  authorized: boolean;
  conferenceId: string;
  conferenceName: string;
  timezone: string;
  ownerName: string;
  conferences: OwnerConferenceOption[];
};

const emptyContext: OwnerConferenceContext = {
  authorized: false,
  conferenceId: "",
  conferenceName: "",
  timezone: "America/Los_Angeles",
  ownerName: "",
  conferences: [],
};

export const getOwnerConferenceContext = cache(async (): Promise<OwnerConferenceContext> => {
  await connection();
  const supabase = await createClient();
  const userId = await getSessionUserId();
  if (!userId) return emptyContext;

  const [{ data: ownerProfile }, { data: platformOwnerRecord }, { data: memberships }] =
    await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabase
        .from("platform_owner_records")
        .select("status")
        .eq("profile_id", userId)
        .maybeSingle(),
      supabase
        .from("conference_memberships")
        .select("conference_id,created_at,conferences(id,name,timezone)")
        .eq("profile_id", userId)
        .eq("role", "owner")
        .order("created_at", { ascending: false }),
    ]);
  if (platformOwnerRecord?.status === "suspended") return emptyContext;
  if (!memberships?.length) return emptyContext;
  const ownedConferenceIds = memberships.map((membership) => membership.conference_id);
  // The conference rows come back on the memberships read above, so this no
  // longer needs a round trip of its own. cookies() is local.
  type OwnedConference = { id: string; name: string; timezone: string };
  const conferenceRows = (
    memberships as unknown as { conferences: OwnedConference | null }[]
  ).flatMap((membership) => (membership.conferences ? [membership.conferences] : []));
  const cookieStore = await cookies();
  const preferredConferenceId = cookieStore.get("kch_owner_conference")?.value;
  const selectedConferenceId =
    preferredConferenceId && ownedConferenceIds.includes(preferredConferenceId)
      ? preferredConferenceId
      : ownedConferenceIds[0];
  const conference = conferenceRows?.find((item) => item.id === selectedConferenceId);
  if (!conference) return emptyContext;
  return {
    authorized: true,
    conferenceId: conference.id,
    conferenceName: conference.name,
    timezone: conference.timezone || "America/Los_Angeles",
    ownerName: ownerProfile?.display_name ?? "Conference Owner",
    conferences: ownedConferenceIds.flatMap((id) => {
      const item = conferenceRows?.find((row) => row.id === id);
      return item ? [{ id: item.id, name: item.name }] : [];
    }),
  };
});

/** The selected conference id on its own, for callers that need only that. */
export async function getOwnerConferenceId(): Promise<string> {
  return (await getOwnerConferenceContext()).conferenceId;
}

/**
 * What /profile?view=owner renders of the owner workspace: the conference
 * header, and the name of the current season with its division names.
 *
 * It used to reach for getOwnerPortalData(), which reads every registration,
 * fee, payment, game and invitation in the conference - about 19 requests - to
 * render two lines of text. This is the same two lines in one request.
 *
 * Deliberately not a "scope" argument on getOwnerPortalData(). A scope that
 * returns the full record with most of it left empty fails silently when a page
 * later reads a field the scope never filled; a named function with only the
 * fields it provides cannot.
 */
export type OwnerProfileSummary = {
  authorized: boolean;
  conferenceId: string;
  conferenceName: string;
  conferences: OwnerConferenceOption[];
  ownerName: string;
  activeSeasonName: string;
  activeSeasonDivisions: string[];
};

export async function getOwnerProfileSummary(): Promise<OwnerProfileSummary> {
  const context = await getOwnerConferenceContext();
  if (!context.authorized)
    return { ...emptyContext, activeSeasonName: "", activeSeasonDivisions: [] };
  const supabase = await createClient();
  const { data: seasonRows } = await supabase
    .from("seasons")
    .select("id,name,starts_on,ends_on,canceled_at,divisions(name)")
    .eq("conference_id", context.conferenceId)
    .is("archived_at", null)
    .order("starts_on", { ascending: false })
    .order("name", { referencedTable: "divisions" });
  // The same choice getOwnerPortalData()'s consumers make: the season running
  // today, else the most recent one that was not canceled.
  const today = new Date().toISOString().slice(0, 10);
  const live = (seasonRows ?? []).filter((season) => !season.canceled_at);
  const active =
    live.find((season) => season.starts_on <= today && season.ends_on >= today) ?? live[0] ?? null;
  return {
    ...context,
    activeSeasonName: active?.name ?? "",
    activeSeasonDivisions: (active?.divisions ?? []).map((division) => division.name),
  };
}

/**
 * Memoised for the same reason getOwnerConferenceContext() is: pages now render
 * several <Suspense> boundaries that each need the portal, and without cache()
 * every boundary would repeat the whole read. React's cache() lives for a
 * single render pass, so the boundaries share one in-flight request and nothing
 * is held across requests or between viewers.
 */
export const getOwnerPortalData = cache(async (): Promise<OwnerPortalData> => {
  const supabase = await createClient();
  const context = await getOwnerConferenceContext();
  if (!context.authorized) return empty;
  const conference = {
    id: context.conferenceId,
    name: context.conferenceName,
    timezone: context.timezone,
  };
  const conferences = context.conferences;

  // Every column the portal needs off seasons, in one read. This used to be two
  // reads of the same rows a wave apart - the second one existed only to pick up
  // setup_stage and the four columns beside it.
  const { data: seasonRows } = await supabase
    .from("seasons")
    .select(
      "id,name,starts_on,ends_on,registration_open,setup_stage,preseason_ready,canceled_at,cancellation_reason,players_per_team",
    )
    .eq("conference_id", conference.id)
    .is("archived_at", null)
    .order("starts_on", { ascending: false });
  const seasonIds = (seasonRows ?? []).map((row) => row.id);
  const setupRows = seasonRows;
  const [
    { data: financialRows },
    { data: divisionRows },
    { data: paymentSubmissionRows },
    { data: poolRows },
  ] = await Promise.all([
    seasonIds.length
      ? supabase
          .from("season_financial_summaries")
          .select(
            "season_id,court_cost_cents,referee_cost_cents,uniform_cost_cents,league_cost_cents,notes",
          )
          .in("season_id", seasonIds)
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("divisions")
          .select("id,season_id,name")
          .in("season_id", seasonIds)
          .order("name")
      : Promise.resolve({ data: [] }),
    // Deliberately unfiltered, which looks like an oversight and is not.
    //
    // A submission reaches its conference by one of two paths, and neither one
    // is always present: fee_id was made nullable by 0018 for account-level
    // payments and waivers, and registration_id only arrived in 0037 so older
    // rows can be missing it. Filtering through either alone silently drops the
    // rows that took the other path - a `fees!inner(...)` filter tried here
    // returned 2 of the 8 rows in the table - and PostgREST cannot OR across
    // two embedded joins in one request.
    //
    // The mapping below resolves both paths and discards anything outside the
    // conference, so reading the table whole is what keeps the result correct.
    // If this table ever grows enough to matter, the fix is two filtered reads
    // merged here, not one filter that quietly loses half the rows.
    supabase
      .from("payment_submissions")
      .select("id,registration_id,fee_id,amount_cents,method,reference,status,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("conference_player_pool")
      .select(
        "player_id,status,player:player_profiles!player_id(id,public_player_id,display_name,profile_id,email,mobile,preferred_uniform_size)",
      )
      .eq("conference_id", conference.id),
  ]);
  const divisionIds = (divisionRows ?? []).map((row) => row.id);
  const [
    { data: teamRows },
    { data: uniformSettingRows },
    { data: financialSettingRows },
    { data: registrationRows },
    { data: invitationRows },
    { data: invitationBroadcastRows },
    { data: rosterBroadcastRows },
    { data: scheduleWorkflowRows },
    { data: gameRows },
    { data: rosterRequestRows },
  ] = await Promise.all([
    divisionIds.length
      ? supabase
          .from("teams")
          .select("id,division_id,name,active,team_roster_drafts(team_id,status,owner_note)")
          .in("division_id", divisionIds)
          .order("name")
      : Promise.resolve({ data: [] }),
    divisionIds.length
      ? supabase
          .from("division_uniform_settings")
          .select("division_id,dark_uniform,light_uniform,dark_image_path,light_image_path")
          .in("division_id", divisionIds)
      : Promise.resolve({ data: [] }),
    divisionIds.length
      ? supabase
          .from("division_financial_settings")
          .select(
            "division_id,league_fee_enabled,league_fee_cents,uniform_fee_enabled,uniform_fee_cents",
          )
          .in("division_id", divisionIds)
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("registrations")
          .select(
            "id,season_id,division_id,team_id,player_id,jersey_number,position,role_label,status,fees(id,registration_id,category,description,amount_cents,status,due_on),payments(id,registration_id,fee_id,amount_cents,method,paid_at),registration_waivers(registration_id,amount_cents),player:player_profiles!player_id(id,public_player_id,display_name,profile_id,email,mobile,preferred_uniform_size)",
          )
          .in("season_id", seasonIds)
          .order("jersey_number")
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("season_invitations")
          .select(
            "id,season_id,division_id,player_id,registration_id,response,selection_status,player:player_profiles!player_id(id,public_player_id,display_name,profile_id,email,mobile,preferred_uniform_size)",
          )
          .in("season_id", seasonIds)
          .order("created_at")
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("season_broadcasts")
          .select("id,season_id,division_id,response_deadline,invited_count,flyer_path,created_at")
          .in("season_id", seasonIds)
          .eq("broadcast_type", "player_invitation")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("season_broadcasts")
          .select("id,division_id,broadcast_type,response_deadline")
          .in("season_id", seasonIds)
          .in("broadcast_type", ["roster_draft", "roster_final"])
      : Promise.resolve({ data: [] }),
    divisionIds.length
      ? supabase
          .from("division_schedule_workflows")
          .select("division_id,mode,status")
          .in("division_id", divisionIds)
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("games")
          .select(
            "id,season_id,home_team_id,away_team_id,starts_at,venue,court,duration_minutes,home_uniform,away_uniform,home_score,away_score,draft_home_score,draft_away_score,finalized_at,phase,status,status_reason",
          )
          .in("season_id", seasonIds)
          .order("starts_at")
      : Promise.resolve({ data: [] }),
    seasonIds.length
      ? supabase
          .from("roster_change_requests")
          .select("id,season_id,team_id,request_type,details,status,owner_note,created_at")
          .in("season_id", seasonIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  // Roster drafts arrive nested on the teams read rather than a follow-up
  // keyed on the ids that read just returned.
  type NestedDraft = { team_id: string; status: string; owner_note: string | null };
  const draftRows = (
    (teamRows ?? []) as unknown as { team_roster_drafts: NestedDraft[] | null }[]
  ).flatMap((row) => row.team_roster_drafts ?? []);
  // Fees, payments and waivers all hang off registration_id, so they come back
  // nested on the registrations read rather than costing another round trip.
  // The paid_at ordering the separate query applied is reproduced here.
  type NestedFee = {
    id: string;
    registration_id: string;
    category: string;
    description: string;
    amount_cents: number;
    status: string;
    due_on: string | null;
  };
  type NestedPayment = {
    id: string;
    registration_id: string;
    fee_id: string;
    amount_cents: number;
    method: string;
    paid_at: string;
  };
  type NestedWaiver = { registration_id: string; amount_cents: number };
  const registrationsWithMoney = (registrationRows ?? []) as unknown as {
    fees: NestedFee[] | null;
    payments: NestedPayment[] | null;
    registration_waivers: NestedWaiver[] | null;
  }[];
  const allFeeRows = registrationsWithMoney.flatMap((row) => row.fees ?? []);
  const ownerPaymentRows = registrationsWithMoney
    .flatMap((row) => row.payments ?? [])
    .sort((a, b) => (a.paid_at < b.paid_at ? 1 : a.paid_at > b.paid_at ? -1 : 0));
  const registrationWaiverRows = registrationsWithMoney.flatMap(
    (row) => row.registration_waivers ?? [],
  );
  // Player details ride along on all three reads that reference a player, so the
  // dedupe that the separate lookup did with a Set now happens on the Map.
  type NestedPlayer = {
    id: string;
    public_player_id: string;
    display_name: string | null;
    profile_id: string | null;
    email: string | null;
    mobile: string | null;
    preferred_uniform_size: string | null;
  };
  const withPlayer = (rows: unknown) =>
    ((rows ?? []) as { player: NestedPlayer | null }[]).flatMap((row) =>
      row.player ? [[row.player.id, row.player] as const] : [],
    );
  const playerDetails = new Map<string, NestedPlayer>([
    ...withPlayer(registrationRows),
    ...withPlayer(invitationRows),
    ...withPlayer(poolRows),
  ]);

  const uniformSettings = new Map((uniformSettingRows ?? []).map((row) => [row.division_id, row]));
  const draftDetails = new Map((draftRows ?? []).map((row) => [row.team_id, row]));
  const financialSettings = new Map(
    (financialSettingRows ?? []).map((row) => [row.division_id, row]),
  );
  const teams: OwnerTeam[] = (teamRows ?? []).map((team) => {
    const players: OwnerRosterPlayer[] = (registrationRows ?? [])
      .filter((row) => row.team_id === team.id)
      .map((row) => {
        const player = playerDetails.get(row.player_id);
        return {
          playerId: row.player_id,
          registrationId: row.id,
          publicPlayerId: player?.public_player_id ?? "",
          name: player?.display_name ?? "Unnamed player",
          email: player?.email ?? "",
          mobile: player?.mobile ?? "",
          uniformSize: player?.preferred_uniform_size ?? "",
          jerseyNumber: row.jersey_number,
          position: row.position ?? "",
          role: row.role_label,
          status: row.status,
          claimed: Boolean(player?.profile_id),
        };
      });
    const uniforms = uniformSettings.get(team.division_id),
      draft = draftDetails.get(team.id);
    return {
      id: team.id,
      name: team.name,
      active: team.active,
      players,
      captain:
        players.find((player) => player.status === "active" && player.role === "Captain")?.name ??
        "Unassigned",
      coCaptain:
        players.find((player) => player.status === "active" && player.role === "Co-captain")
          ?.name ?? "Unassigned",
      homeUniform: uniforms?.dark_uniform ?? "Dark / Navy",
      awayUniform: uniforms?.light_uniform ?? "White",
      draftStatus:
        draft?.status === "submitted"
          ? "submitted"
          : draft?.status === "approved"
            ? "approved"
            : draft?.status === "changes_requested"
              ? "changes_requested"
              : "editing",
      draftOwnerNote: draft?.owner_note ?? "",
    };
  });
  const imageUrl = (path: string | null | undefined) =>
    path ? supabase.storage.from("uniform-photos").getPublicUrl(path).data.publicUrl : "";
  const flyerUrl = (path: string | null | undefined) =>
    path ? supabase.storage.from("invitation-flyers").getPublicUrl(path).data.publicUrl : "";
  const divisions: OwnerDivision[] = (divisionRows ?? []).map((division) => {
    const uniforms = uniformSettings.get(division.id);
    const financial = financialSettings.get(division.id);
    const invitation = (invitationBroadcastRows ?? []).find(
      (row) => row.division_id === division.id,
    );
    const reviewBroadcast = (rosterBroadcastRows ?? []).find(
      (row) => row.division_id === division.id && row.broadcast_type === "roster_draft",
    );
    const scheduleWorkflow = (scheduleWorkflowRows ?? []).find(
      (row) => row.division_id === division.id,
    );
    return {
      id: division.id,
      name: division.name,
      darkUniform: uniforms?.dark_uniform ?? "Dark / Navy",
      lightUniform: uniforms?.light_uniform ?? "White",
      darkImage: imageUrl(uniforms?.dark_image_path),
      lightImage: imageUrl(uniforms?.light_image_path),
      preseasonConfigured: Boolean(financial),
      leagueFeeEnabled: financial?.league_fee_enabled ?? true,
      leagueFee:
        financial?.league_fee_cents === null || financial?.league_fee_cents === undefined
          ? null
          : financial.league_fee_cents / 100,
      uniformFeeEnabled: financial?.uniform_fee_enabled ?? true,
      uniformFee:
        financial?.uniform_fee_cents === null || financial?.uniform_fee_cents === undefined
          ? null
          : financial.uniform_fee_cents / 100,
      invitationSent: Boolean(invitation),
      invitationCount: invitation?.invited_count ?? 0,
      invitationDeadline: invitation?.response_deadline ?? "",
      invitationFlyer: flyerUrl(invitation?.flyer_path),
      rosterPublished: Boolean(reviewBroadcast),
      rosterReviewDeadline: reviewBroadcast?.response_deadline ?? "",
      rosterFinalPublished: (rosterBroadcastRows ?? []).some(
        (row) => row.division_id === division.id && row.broadcast_type === "roster_final",
      ),
      scheduleMode:
        scheduleWorkflow?.mode === "manual"
          ? "manual"
          : scheduleWorkflow?.mode === "kch"
            ? "kch"
            : "",
      scheduleStatus:
        scheduleWorkflow?.status === "final" ? "final" : scheduleWorkflow ? "draft" : "not_started",
      unassignedPlayers: (registrationRows ?? [])
        .filter(
          (registration) =>
            registration.division_id === division.id &&
            !registration.team_id &&
            registration.role_label === "Player" &&
            (registration.status === "active" || registration.status === "pending"),
        )
        .map((registration) => {
          const player = playerDetails.get(registration.player_id);
          return {
            registrationId: registration.id,
            publicPlayerId: player?.public_player_id ?? "",
            name: player?.display_name ?? "Unnamed player",
          };
        }),
      teams: teams.filter(
        (team) => (teamRows ?? []).find((row) => row.id === team.id)?.division_id === division.id,
      ),
    };
  });
  const setupDetails = new Map((setupRows ?? []).map((row) => [row.id, row]));
  const localStartsAt = (iso: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: conference.timezone || "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  };
  const seasons: OwnerSeason[] = (seasonRows ?? []).map((season) => {
    const seasonDivisions = divisions.filter(
      (division) =>
        (divisionRows ?? []).find((row) => row.id === division.id)?.season_id === season.id,
    );
    const seasonTeams = seasonDivisions.flatMap((division) => division.teams);
    const seasonPlayers = seasonTeams.flatMap((team) => team.players);
    const teamNames = new Map(seasonTeams.map((team) => [team.id, team.name]));
    const teamDivisions = new Map((teamRows ?? []).map((team) => [team.id, team.division_id]));
    const inferredStage = seasonPlayers.some(
      (player) => player.status === "active" && player.role === "Captain",
    )
      ? 5
      : seasonPlayers.some((player) => player.status === "active")
        ? 4
        : seasonTeams.length
          ? 3
          : seasonDivisions.length
            ? 2
            : 1;
    const setup = setupDetails.get(season.id);
    const invitees: OwnerInvitee[] = (invitationRows ?? [])
      .filter((row) => row.season_id === season.id)
      .map((row) => {
        const player = playerDetails.get(row.player_id);
        const registration = (registrationRows ?? []).find(
          (item) => item.id === row.registration_id,
        );
        return {
          invitationId: row.id,
          divisionId: row.division_id ?? "",
          registrationId: row.registration_id ?? "",
          publicPlayerId: player?.public_player_id ?? "",
          name: player?.display_name ?? "Unnamed player",
          email: player?.email ?? "",
          mobile: player?.mobile ?? "",
          response:
            row.response === "joining"
              ? "joining"
              : row.response === "not_joining"
                ? "not_joining"
                : "pending",
          selectionStatus:
            row.selection_status === "eligible"
              ? "eligible"
              : row.selection_status === "waitlisted"
                ? "waitlisted"
                : row.selection_status === "declined"
                  ? "declined"
                  : "awaiting_response",
          teamId: registration?.team_id ?? "",
          jerseyNumber: registration?.jersey_number ?? null,
          position: registration?.position ?? "",
        };
      });
    const seasonGames: OwnerGame[] = (gameRows ?? [])
      .filter((row) => row.season_id === season.id)
      .map((row) => ({
        id: row.id,
        divisionId: teamDivisions.get(row.home_team_id) ?? "",
        homeTeamId: row.home_team_id,
        homeTeam: teamNames.get(row.home_team_id) ?? "Home Team",
        awayTeamId: row.away_team_id,
        awayTeam: teamNames.get(row.away_team_id) ?? "Away Team",
        startsAt: row.starts_at,
        localStartsAt: localStartsAt(row.starts_at),
        venue: row.venue,
        court: row.court ?? "",
        homeUniform: row.home_uniform ?? "",
        awayUniform: row.away_uniform ?? "",
        homeScore: row.home_score,
        awayScore: row.away_score,
        draftHomeScore: row.draft_home_score ?? null,
        draftAwayScore: row.draft_away_score ?? null,
        finalized: Boolean(row.finalized_at),
        phase: row.phase === "playoff" ? "playoff" : "regular",
        status:
          row.status === "postponed"
            ? "postponed"
            : row.status === "canceled"
              ? "canceled"
              : "scheduled",
        statusReason: row.status_reason ?? "",
      }));
    return {
      id: season.id,
      name: season.name,
      startsOn: season.starts_on,
      endsOn: season.ends_on,
      registrationOpen: season.registration_open,
      playersPerTeam: setup?.players_per_team ?? null,
      setupStage: Number(setup?.setup_stage) || inferredStage,
      preseasonReady: setup?.preseason_ready ?? Number(setup?.setup_stage) >= 5,
      canceledAt: setup?.canceled_at ?? "",
      cancelReason: setup?.cancellation_reason ?? "",
      divisions: seasonDivisions,
      invitees,
      games: seasonGames,
    };
  });
  const feeDetails = new Map((allFeeRows ?? []).map((row) => [row.id, row]));
  const teamDetails = new Map((teamRows ?? []).map((row) => [row.id, row]));
  const divisionDetails = new Map((divisionRows ?? []).map((row) => [row.id, row]));
  const seasonDetails = new Map((seasonRows ?? []).map((row) => [row.id, row]));
  const paymentSubmissions: OwnerPaymentSubmission[] = (paymentSubmissionRows ?? []).flatMap(
    (row) => {
      const fee = feeDetails.get(row.fee_id);
      const registrationId = row.registration_id ?? fee?.registration_id;
      const registration = (registrationRows ?? []).find((item) => item.id === registrationId);
      const player = registration ? playerDetails.get(registration.player_id) : undefined;
      const team = registration?.team_id ? teamDetails.get(registration.team_id) : undefined;
      const division = team ? divisionDetails.get(team.division_id) : undefined;
      const season = division ? seasonDetails.get(division.season_id) : undefined;
      return registration && player && season
        ? [
            {
              id: row.id,
              playerName: player.display_name ?? "Unnamed player",
              feeLabel:
                fee?.description ??
                (row.method === "waiver" ? "Account waiver" : "Account payment"),
              amount: row.amount_cents / 100,
              method: row.method,
              reference: row.reference ?? "",
              status:
                row.status === "confirmed"
                  ? "confirmed"
                  : row.status === "declined"
                    ? "declined"
                    : "pending",
              seasonName: season.name,
              teamName: team?.name ?? "Unassigned",
              createdLabel: new Intl.DateTimeFormat("en-US", {
                timeZone: conference.timezone || "America/Los_Angeles",
                dateStyle: "medium",
              }).format(new Date(row.created_at)),
            },
          ]
        : [];
    },
  );
  const paymentsByFee = new Map<
    string,
    Array<{ id: string; fee_id: string; amount_cents: number; method: string; paid_at: string }>
  >();
  for (const payment of ownerPaymentRows ?? []) {
    const items = paymentsByFee.get(payment.fee_id) ?? [];
    items.push(payment);
    paymentsByFee.set(payment.fee_id, items);
  }
  const pendingFeeIds = new Set(
    (paymentSubmissionRows ?? [])
      .filter((row) => row.status === "pending")
      .map((row) => row.fee_id),
  );
  const paymentsByRegistration = new Map<
    string,
    Array<{
      id: string;
      registration_id: string;
      fee_id: string | null;
      amount_cents: number;
      method: string;
      paid_at: string;
    }>
  >();
  for (const payment of ownerPaymentRows ?? []) {
    if (!payment.registration_id) continue;
    const items = paymentsByRegistration.get(payment.registration_id) ?? [];
    items.push(payment);
    paymentsByRegistration.set(payment.registration_id, items);
  }
  const pendingRegistrationIds = new Set(
    (paymentSubmissionRows ?? [])
      .filter((row) => row.status === "pending" && row.registration_id)
      .map((row) => row.registration_id),
  );
  const waiversByRegistration = new Map<string, number>();
  for (const waiver of registrationWaiverRows ?? [])
    waiversByRegistration.set(
      waiver.registration_id,
      (waiversByRegistration.get(waiver.registration_id) ?? 0) + waiver.amount_cents,
    );
  const paymentGroups: OwnerPaymentGroup[] = [];
  for (const division of divisionRows ?? []) {
    const season = seasonDetails.get(division.season_id);
    if (!season) continue;
    const divisionTeamIds = new Set(
      (teamRows ?? []).filter((team) => team.division_id === division.id).map((team) => team.id),
    );
    const divisionRegistrations = (registrationRows ?? []).filter(
      (registration) => registration.team_id && divisionTeamIds.has(registration.team_id),
    );
    const players: OwnerPlayerPayment[] = divisionRegistrations
      .map((registration) => {
        const fees = (allFeeRows ?? []).filter((fee) => fee.registration_id === registration.id);
        const payments = paymentsByRegistration.get(registration.id) ?? [];
        const assessed = fees.reduce((sum, fee) => sum + fee.amount_cents, 0) / 100;
        const received = payments.reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;
        const waived =
          (waiversByRegistration.get(registration.id) ?? 0) / 100 +
          fees
            .filter((fee) => fee.status === "waived")
            .reduce((sum, fee) => sum + fee.amount_cents, 0) /
            100;
        const due = Math.max(0, assessed - received - waived);
        const team = registration.team_id ? teamDetails.get(registration.team_id) : undefined;
        const player = playerDetails.get(registration.player_id);
        const methods = [...new Set(payments.map((payment) => payment.method))];
        const pendingReview =
          pendingRegistrationIds.has(registration.id) ||
          fees.some((fee) => pendingFeeIds.has(fee.id));
        const status: OwnerPlayerPayment["status"] =
          due > 0
            ? received > 0 || waived > 0
              ? "Mixed"
              : "Due"
            : received > 0
              ? "Paid"
              : waived > 0
                ? "Waived"
                : "Paid";
        return {
          registrationId: registration.id,
          playerName: player?.display_name ?? "Unnamed player",
          teamName: team?.name ?? "Unassigned",
          assessed,
          received,
          due,
          waived,
          methods,
          pendingReview,
          status,
        };
      })
      .filter((player) => player.assessed > 0 || player.received > 0 || player.waived > 0);
    const divisionRegistrationIds = new Set(
      divisionRegistrations.map((registration) => registration.id),
    );
    const divisionFeeIds = new Set(
      divisionRegistrations.flatMap((registration) =>
        (allFeeRows ?? [])
          .filter((fee) => fee.registration_id === registration.id)
          .map((fee) => fee.id),
      ),
    );
    const payments = (ownerPaymentRows ?? []).filter((payment) =>
      divisionRegistrationIds.has(payment.registration_id),
    );
    const fees = (allFeeRows ?? []).filter((fee) => divisionFeeIds.has(fee.id));
    if (!players.length && !fees.length) continue;
    const leagueFee = (fees.find((fee) => fee.category === "league")?.amount_cents ?? 0) / 100;
    const uniformFee = (fees.find((fee) => fee.category === "uniform")?.amount_cents ?? 0) / 100;
    const platformFee = (fees.find((fee) => fee.category === "platform")?.amount_cents ?? 0) / 100;
    const totalPlayers = divisionRegistrations.filter(
      (registration) => registration.status === "active",
    ).length;
    const paidPlayers = players.filter((player) => player.due === 0 && player.received > 0);
    const waivedPlayers = players.filter(
      (player) => player.due === 0 && player.received === 0 && player.waived > 0,
    );
    const categoryReceived = (category: string) =>
      payments
        .filter((payment) => fees.find((fee) => fee.id === payment.fee_id)?.category === category)
        .reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;
    paymentGroups.push({
      seasonId: season.id,
      seasonName: season.name,
      divisionId: division.id,
      divisionName: division.name,
      leagueFee,
      uniformFee,
      platformFee,
      perPlayerTotal: leagueFee + uniformFee + platformFee,
      totalPlayers,
      paidPlayers: paidPlayers.length,
      unpaidPlayers: Math.max(0, totalPlayers - paidPlayers.length - waivedPlayers.length),
      waivedPlayers: waivedPlayers.length,
      cashPlayers: paidPlayers.filter((player) => player.methods.includes("cash")).length,
      zellePlayers: paidPlayers.filter((player) => player.methods.includes("zelle")).length,
      assessed: players.reduce((sum, player) => sum + player.assessed, 0),
      received: players.reduce((sum, player) => sum + player.received, 0),
      due: players.reduce((sum, player) => sum + player.due, 0),
      waived: players.reduce((sum, player) => sum + player.waived, 0),
      cashReceived:
        payments
          .filter((payment) => payment.method === "cash")
          .reduce((sum, payment) => sum + payment.amount_cents, 0) / 100,
      zelleReceived:
        payments
          .filter((payment) => payment.method === "zelle")
          .reduce((sum, payment) => sum + payment.amount_cents, 0) / 100,
      leagueReceived: categoryReceived("league"),
      uniformReceived: categoryReceived("uniform"),
      platformReceived: categoryReceived("platform"),
      paymentCount: payments.length,
      pendingCount:
        divisionRegistrations.filter((registration) => pendingRegistrationIds.has(registration.id))
          .length + fees.filter((fee) => pendingFeeIds.has(fee.id)).length,
      players,
    });
  }
  const financials: OwnerSeasonFinancial[] = (financialRows ?? []).map((row) => ({
    seasonId: row.season_id,
    courtCost: row.court_cost_cents / 100,
    refereeCost: row.referee_cost_cents / 100,
    uniformCost: row.uniform_cost_cents / 100,
    leagueCost: row.league_cost_cents / 100,
    notes: row.notes ?? "",
  }));
  const poolDetails = new Map((poolRows ?? []).map((row) => [row.player_id, row]));
  const currentSeasonId = seasons.find((season) => !season.canceledAt)?.id ?? "";
  const directory: OwnerDirectoryPlayer[] = [...playerDetails.values()]
    .filter((row) => poolDetails.has(row.id))
    .map((row) => {
      const registrations = (registrationRows ?? []).filter(
          (registration) => registration.player_id === row.id,
        ),
        pool = poolDetails.get(row.id);
      const status: OwnerDirectoryPlayer["status"] =
        pool?.status === "suspended"
          ? "suspended"
          : pool?.status === "inactive"
            ? "inactive"
            : "active";
      return {
        id: row.id,
        publicPlayerId: row.public_player_id,
        name: row.display_name ?? "Unnamed player",
        email: row.email ?? "",
        mobile: row.mobile ?? "",
        seasonsJoined: new Set(registrations.map((registration) => registration.season_id)).size,
        divisionsJoined: new Set(
          registrations.map((registration) => registration.division_id).filter(Boolean),
        ).size,
        playingThisSeason: registrations.some(
          (registration) =>
            registration.season_id === currentSeasonId &&
            Boolean(registration.team_id) &&
            registration.status === "active",
        ),
        status,
        claimed: Boolean(row.profile_id),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const rosterRequests: OwnerRosterRequest[] = (rosterRequestRows ?? []).map((row) => ({
    id: row.id,
    seasonName: seasonDetails.get(row.season_id)?.name ?? "Season",
    teamName: teamDetails.get(row.team_id)?.name ?? "Team",
    type: row.request_type,
    details: row.details,
    status: row.status,
    ownerNote: row.owner_note ?? "",
    createdAt: row.created_at,
  }));
  return {
    authorized: true,
    conferenceId: conference.id,
    conferenceName: conference.name,
    conferences,
    directory,
    ownerName: context.ownerName,
    timezone: conference.timezone || "America/Los_Angeles",
    seasons,
    paymentSubmissions,
    paymentGroups,
    financials,
    rosterRequests,
  };
});
