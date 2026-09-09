"use client";

import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Download,
  FileCheck,
  Landmark,
  Pencil,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./OwnerTeams.module.css";
import directoryStyles from "./OwnerDirectory.module.css";
import {
  advanceSeasonSetupAction,
  assignDirectoryLeaderAction,
  assignDraftPlayerAction,
  assignUnassignedPlayerAction,
  cancelSeasonAction,
  changeGameStatusAction,
  completePreseasonDetailsAction,
  copyPreviousUniformsAction,
  createDivisionsAction,
  createGameAction,
  createSeasonAction,
  createTeamsAction,
  finalizeDivisionScheduleAction,
  generateDivisionScheduleAction,
  inviteDivisionPlayersAction,
  publishDivisionFinalRosterAction,
  publishDivisionRosterAction,
  rescheduleGameAction,
  returnPlayerToDraftPoolAction,
  reviewPaymentNoticeAction,
  reviewRosterChangeRequestAction,
  reviewTeamRosterAction,
  saveDivisionGameDayAction,
  saveDivisionPreseasonAction,
  setConferencePlayerStatusAction,
  setDivisionRosterReviewDeadlineAction,
  updateDivisionUniformImagesAction,
  updateLeadershipAction,
  type OwnerActionState,
} from "@/app/owner/actions";
import type {
  OwnerDirectoryPlayer,
  OwnerDivision,
  OwnerPaymentGroup,
  OwnerPaymentSubmission,
  OwnerRosterPlayer,
  OwnerRosterRequest,
  OwnerSeason,
  OwnerTeam,
} from "@/lib/owner-data";
import {
  gamePhase,
  gamePhaseTone,
  scheduleStatus,
  scheduleStatusTone,
  scheduleTableScroll,
  scheduleWeek,
  weeklySchedule,
  weeklyScheduleList,
} from "@/components/ui/schedule-classes";
import {
  batchSaveButton,
  cardLabel,
  compactFields,
  emptyNote,
  emptyOperation,
  fieldHelp,
  operationsIntro,
  ownerForm,
  ownerIcon,
  ownerOperations,
  ownerSection,
  pageSection,
  reviewActions,
  reviewActionsCompact,
  sectionTitle,
} from "@/components/ui/shared-classes";

const initialState: OwnerActionState = {};
function Feedback({ state }: { state: OwnerActionState }) {
  return (
    <>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
    </>
  );
}
/* The wizard's small parts: an instruction line, the step-advance footer, and
   the division invitation card with its two states. */
const stepNote = "m-0 text-xs leading-[1.5] text-muted";
const advanceStep =
  "grid gap-[7px] border-t border-line pt-[13px] [&>small]:text-center [&>small]:text-[9px] [&>small]:text-muted";
const batchForm = "owner-form rounded-[13px] border border-line bg-[#fbfaf8] p-3";
const divisionInvitation =
  "overflow-hidden rounded-[14px] border border-line bg-white [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:grid-cols-[1fr_auto_auto] [&>summary]:items-center [&>summary]:gap-[9px] [&>summary]:p-[13px] [&>summary_span]:grid [&>summary_span]:gap-[3px] [&>summary_small]:text-[10px] [&>summary_small]:text-muted [&>summary_em]:rounded-lg [&>summary_em]:p-[5px_7px] [&>summary_em]:text-[9px] [&>summary_em]:font-[800] [&>summary_em]:not-italic";
const invitationSent = "[&>summary_em]:bg-[#e8f4e8] [&>summary_em]:text-green";
const invitationPending =
  "border-[#e6b35c] [&>summary_em]:bg-[#fff4da] [&>summary_em]:text-[#795009]";

function DivisionJoinLink({ divisionId }: { divisionId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${divisionId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="my-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[10px] rounded-[13px] border border-[#c9d8ed] bg-[#f5f9ff] p-3 [&>span]:grid [&>span]:gap-1 [&_b]:text-[13px] [&_b]:text-blue [&_small]:text-[10px] [&_small]:leading-[1.35] [&_small]:text-muted [&_button]:rounded-[10px] [&_button]:border [&_button]:border-blue [&_button]:bg-white [&_button]:p-[9px] [&_button]:text-[11px] [&_button]:font-[850] [&_button]:whitespace-nowrap [&_button]:text-blue">
      <span>
        <b>Share this division link</b>
        <small>It identifies the exact conference and division.</small>
      </span>
      <button type="button" onClick={copy}>
        {copied ? "Copied!" : "Copy Join Link"}
      </button>
    </div>
  );
}

export function CreateSeasonForm({ conferenceId }: { conferenceId: string }) {
  const [state, action, pending] = useActionState(createSeasonAction, initialState);
  return (
    <form action={action} className={`${ownerForm} season-create-form`}>
      <input type="hidden" name="conferenceId" value={conferenceId} />
      <input type="hidden" name="divisionName" value="" />
      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-[8px] max-[500px]:grid-cols-2 [&_label]:text-[10px] [&_input]:min-h-[44px] [&_input]:p-[9px]! [&_input]:text-[13px]!">
        <label className="max-[500px]:col-span-full">
          Season name
          <input name="name" defaultValue="Fall 2026" maxLength={80} required />
        </label>
        <label>
          Start date
          <input name="startsOn" type="date" defaultValue="2026-09-01" required />
        </label>
        <label>
          End date
          <input name="endsOn" type="date" defaultValue="2026-12-31" required />
        </label>
      </div>
      <label className="check-row">
        <input name="registrationOpen" type="checkbox" /> Open player registration immediately
      </label>
      <Feedback state={state} />
      <button className="btn primary" disabled={pending}>
        {pending ? "Creating…" : "Create Season"}
      </button>
    </form>
  );
}

function AdvanceStepForm({
  seasonId,
  stage,
  label,
}: {
  seasonId: string;
  stage: number;
  label: string;
}) {
  const [state, action, pending] = useActionState(advanceSeasonSetupAction, initialState);
  return (
    <form action={action} className={advanceStep}>
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="stage" value={stage} />
      <Feedback state={state} />
      <button className="btn primary" disabled={pending}>
        {pending ? "Locking step…" : label}
      </button>
      <small>After continuing, this step is locked in the setup wizard.</small>
    </form>
  );
}

/* Season setup: the wizard's disclosure groups, its sub-forms, and the small
   grids the create and batch forms are built from. */
const guidedGroup =
  "overflow-hidden rounded-[13px] border border-line bg-white [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[1fr_auto] [&>summary]:items-center [&>summary]:gap-[8px] [&>summary]:p-[12px] [&>summary::-webkit-details-marker]:hidden [&>summary>span:first-child]:grid [&>summary>span:first-child]:gap-[3px] [&>summary_small]:text-[10px] [&>summary_small]:text-muted [&>div]:grid [&>div]:gap-[11px] [&>div]:border-t [&>div]:border-line [&>div]:p-[12px]";
const guidedSubform =
  "overflow-hidden rounded-[11px] border border-line [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:p-[10px_12px] [&>summary]:text-[11px] [&>summary]:font-[800] [&>summary]:text-blue [&>summary::-webkit-details-marker]:hidden [&>form]:border-t [&>form]:border-line [&>form]:p-[12px]";
/* padding and font-size shout: .owner-form input sets both unlayered. */
const batchCountField =
  "grid! grid-cols-[minmax(0,1fr)_68px]! items-center gap-[10px]! [&_input]:min-h-[44px] [&_input]:text-center [&_input]:text-[18px]! [&_input]:font-[850]";
const batchNameGrid =
  "grid grid-cols-1 gap-[8px] [&_label]:text-[10px] [&_input]:min-h-[44px] [&_input]:p-[9px]! [&_input]:text-[14px]!";

function DivisionSetupStep({ season }: { season: OwnerSeason }) {
  const [state, action, pending] = useActionState(createDivisionsAction, initialState);
  const [divisionCount, setDivisionCount] = useState(1);
  const remaining = Math.max(0, 10 - season.divisions.length);
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Create every division for <b>{season.name}</b> together. A season can have up to 10
        divisions, and another division can be added later.
      </p>
      {season.divisions.length > 0 && (
        <div className="flex flex-wrap gap-[6px] [&>span]:rounded-xl [&>span]:bg-[#e8f4e8] [&>span]:p-[6px_9px] [&>span]:text-[10px] [&>span]:font-[700] [&>span]:text-green">
          {season.divisions.map((division) => (
            <span key={division.id}>
              <Check className="ui-icon" /> {division.name}
            </span>
          ))}
        </div>
      )}
      {remaining > 0 && (
        <form action={action} className={batchForm}>
          <input type="hidden" name="seasonId" value={season.id} />
          <label className={batchCountField}>
            How many divisions are you creating now?
            <input
              type="number"
              min="1"
              max={remaining}
              inputMode="numeric"
              value={Math.min(divisionCount, remaining)}
              onChange={(event) =>
                setDivisionCount(Math.min(remaining, Math.max(1, Number(event.target.value) || 1)))
              }
            />
          </label>
          <div className={batchNameGrid}>
            {Array.from({ length: Math.min(divisionCount, remaining) }, (_, index) => (
              <label key={index}>
                Division {index + 1}
                <input
                  name="divisionName"
                  placeholder={index === 0 ? "Example: Division A" : "Division name"}
                  maxLength={80}
                  required
                />
              </label>
            ))}
          </div>
          <Feedback state={state} />
          <button className={`btn secondary ${batchSaveButton}`} disabled={pending}>
            {pending
              ? "Saving divisions…"
              : `Save ${Math.min(divisionCount, remaining)} Division${Math.min(divisionCount, remaining) === 1 ? "" : "s"}`}
          </button>
        </form>
      )}
      <AdvanceStepForm seasonId={season.id} stage={1} label="Divisions Complete — Continue" />
    </div>
  );
}

function DivisionTeamBuilder({ division }: { division: OwnerSeason["divisions"][number] }) {
  const [state, action, pending] = useActionState(createTeamsAction, initialState);
  const [teamCount, setTeamCount] = useState(division.teams.length ? 1 : 8);
  return (
    <details className={guidedGroup} open>
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {division.teams.length} team{division.teams.length === 1 ? "" : "s"} saved
          </small>
        </span>
        <span aria-hidden="true">
          <ChevronRight className="go-caret" />
        </span>
      </summary>
      <div>
        {division.teams.length > 0 && (
          <div className="flex flex-wrap gap-[6px] [&>span]:rounded-xl [&>span]:bg-[#e8f4e8] [&>span]:p-[6px_9px] [&>span]:text-[10px] [&>span]:font-[700] [&>span]:text-green">
            {division.teams.map((team) => (
              <span key={team.id}>
                <Check className="ui-icon" /> {team.name}
              </span>
            ))}
          </div>
        )}
        <form action={action} className={batchForm}>
          <input type="hidden" name="divisionId" value={division.id} />
          <label className={batchCountField}>
            How many teams are you creating for {division.name}?
            <input
              type="number"
              min="1"
              max="30"
              inputMode="numeric"
              value={teamCount}
              onChange={(event) =>
                setTeamCount(Math.min(30, Math.max(1, Number(event.target.value) || 1)))
              }
            />
          </label>
          <div className={batchNameGrid}>
            {Array.from({ length: teamCount }, (_, index) => (
              <label key={index}>
                Team {index + 1}
                <input
                  name="teamName"
                  placeholder={`Team ${index + 1} name`}
                  maxLength={80}
                  required
                />
              </label>
            ))}
          </div>
          <Feedback state={state} />
          <button className={`btn secondary ${batchSaveButton}`} disabled={pending}>
            {pending ? "Saving teams…" : `Save ${teamCount} Team${teamCount === 1 ? "" : "s"}`}
          </button>
        </form>
      </div>
    </details>
  );
}

function TeamsSetupStep({ season }: { season: OwnerSeason }) {
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Choose the team count for each division, enter every team name, then save the group
        together.
      </p>
      {season.divisions.map((division) => (
        <DivisionTeamBuilder key={division.id} division={division} />
      ))}
      <AdvanceStepForm seasonId={season.id} stage={2} label="Teams Complete — Continue" />
    </div>
  );
}

function DirectoryLeaderPicker({
  teamId,
  role,
  currentName,
  directory,
}: {
  teamId: string;
  role: "Captain" | "Co-captain";
  currentName: string;
  directory: OwnerDirectoryPlayer[];
}) {
  const [state, action, pending] = useActionState(assignDirectoryLeaderAction, initialState);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OwnerDirectoryPlayer | null>(null);
  const normalized = query.trim().toLowerCase();
  const matches =
    normalized.length < 2
      ? []
      : directory
          .filter(
            (player) =>
              player.name.toLowerCase().includes(normalized) ||
              player.email.toLowerCase().includes(normalized) ||
              player.publicPlayerId.toLowerCase().includes(normalized),
          )
          .slice(0, 6);
  return (
    <details className={`leader-search ${guidedSubform}`} open={currentName === "Unassigned"}>
      <summary>
        {role}: {currentName}
      </summary>
      <form action={action} className={ownerForm}>
        <input type="hidden" name="teamId" value={teamId} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="playerId" value={selected?.id ?? ""} />
        <label>
          Search player name
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            placeholder="Type at least 2 letters"
            autoComplete="off"
          />
        </label>
        {normalized.length >= 2 && (
          <div className="grid gap-[6px] rounded-xl border border-line bg-white p-[6px] [&>button]:grid [&>button]:w-full [&>button]:cursor-pointer [&>button]:gap-[2px] [&>button]:rounded-[9px] [&>button]:border-0 [&>button]:bg-[#f7f8fa] [&>button]:p-[10px_12px] [&>button]:text-left [&>button]:text-navy! [&>button:hover]:bg-[#edf3fa] [&_small]:text-[11px] [&_small]:text-muted [&>p]:m-[6px] [&>p]:text-[13px] [&>p]:text-muted">
            {matches.length ? (
              matches.map((player) => (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => {
                    setSelected(player);
                    setQuery(player.name);
                  }}
                >
                  <b>{player.name}</b>
                  <small>
                    {player.publicPlayerId}
                    {player.email ? ` · ${player.email}` : ""}
                  </small>
                </button>
              ))
            ) : (
              <p>
                No player found. The captain must first have a player profile in this conference.
              </p>
            )}
          </div>
        )}
        {selected && (
          <p className="m-0 rounded-[10px] bg-[#eef8ef] p-[10px_12px] text-[#176a31]">
            <Check className="ui-icon" /> Selected: <b>{selected.name}</b>
          </p>
        )}
        <p className={fieldHelp}>
          The full player directory stays hidden until you search. Assigning this role also creates
          the player&apos;s normal season registration.
        </p>
        <Feedback state={state} />
        <button className="btn secondary" disabled={pending || !selected}>
          {pending ? "Assigning…" : `Assign ${role}`}
        </button>
      </form>
    </details>
  );
}

function CaptainsSetupStep({
  season,
  directory,
}: {
  season: OwnerSeason;
  directory: OwnerDirectoryPlayer[];
}) {
  const teams = season.divisions.flatMap((division) => division.teams);
  const suggestions = [
    "Adrian Aguilar",
    "Bianca Bautista",
    "Gabriel Castillo",
    "Jasmine Del Rosario",
    "Lorenzo Flores",
    "Nathan Santos",
  ];
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Search the conference player directory to assign each captain and co-captain. Leaders
        register like every other player and cannot lead two teams in the same season.
      </p>
      <aside className="rounded-[13px] border border-[#edd7ae] bg-[#fffaf0] p-3 [&>small]:font-[800] [&>small]:text-[#a96500] [&>div]:flex [&>div]:gap-[6px] [&>div]:overflow-x-auto [&>div]:pt-2 [&_span]:flex-none [&_span]:rounded-full [&_span]:border [&_span]:border-[#edd7ae] [&_span]:bg-white [&_span]:p-[7px_9px] [&_span]:text-xs">
        <small>FAKE PLAYERS TO TRY</small>
        <div>
          {suggestions.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </aside>
      {teams.map((team) => (
        <details className={guidedGroup} key={team.id}>
          <summary>
            <span>
              <b>{team.name}</b>
              <small>
                Captain: {team.captain} · Co-captain: {team.coCaptain}
              </small>
            </span>
            <span aria-hidden="true">
              <ChevronRight className="go-caret" />
            </span>
          </summary>
          <div>
            <DirectoryLeaderPicker
              teamId={team.id}
              role="Captain"
              currentName={team.captain}
              directory={directory}
            />
            <DirectoryLeaderPicker
              teamId={team.id}
              role="Co-captain"
              currentName={team.coCaptain}
              directory={directory}
            />
          </div>
        </details>
      ))}
      <AdvanceStepForm seasonId={season.id} stage={3} label="Captains Complete — Continue" />
    </div>
  );
}

const money = (amount: number | null) =>
  amount === null
    ? "Not set"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

function PreseasonDivisionForm({
  division,
  previousDivisions,
}: {
  division: OwnerDivision;
  previousDivisions: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(saveDivisionPreseasonAction, initialState);
  const [leagueEnabled, setLeagueEnabled] = useState(division.leagueFeeEnabled);
  const [uniformEnabled, setUniformEnabled] = useState(division.uniformFeeEnabled);
  const [copyState, copyAction, copyPending] = useActionState(
    copyPreviousUniformsAction,
    initialState,
  );
  return (
    <details className={`preseason-division ${guidedGroup}`} open={!division.preseasonConfigured}>
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {division.preseasonConfigured
              ? `League ${division.leagueFeeEnabled ? money(division.leagueFee) : "off"} · Uniform ${division.uniformFeeEnabled ? money(division.uniformFee) : "off"}`
              : "Fees not saved"}
          </small>
        </span>
        <span aria-hidden="true">
          <ChevronRight className="go-caret" />
        </span>
      </summary>
      <div>
        {previousDivisions.length > 0 && (
          <form action={copyAction} className={`${ownerForm} reuse-uniform-form`}>
            <input type="hidden" name="divisionId" value={division.id} />
            <label>
              Reuse prior season uniforms
              <select name="sourceDivisionId" defaultValue="" required>
                <option value="" disabled>
                  Choose a prior division
                </option>
                {previousDivisions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <Feedback state={copyState} />
            <button className="btn secondary" disabled={copyPending}>
              {copyPending ? "Copying…" : "Use Previous Uniforms"}
            </button>
            <small>Copies the dark/light photos only. Fees stay specific to this season.</small>
          </form>
        )}
        <form
          action={action}
          className={`${ownerForm} [&_fieldset]:m-0 [&_fieldset]:border-0 [&_fieldset]:p-0`}
        >
          <input type="hidden" name="divisionId" value={division.id} />
          <fieldset className="grid gap-[10px] rounded-[13px]! border! border-line! bg-[#fbfaf8] p-3! [&>.check-row]:text-sm [&_input:disabled]:bg-[#eee] [&_input:disabled]:text-[#999]">
            <label className="check-row">
              <input
                name="leagueFeeEnabled"
                type="checkbox"
                checked={leagueEnabled}
                onChange={(event) => setLeagueEnabled(event.target.checked)}
              />{" "}
              Charge a league fee
            </label>
            <label>
              League fee amount ($)
              <input
                name="leagueFee"
                type="number"
                min="0"
                max="100000"
                step="0.01"
                inputMode="decimal"
                defaultValue={division.leagueFee ?? ""}
                disabled={!leagueEnabled}
                required={leagueEnabled}
              />
            </label>
          </fieldset>
          <fieldset className="grid gap-[10px] rounded-[13px]! border! border-line! bg-[#fbfaf8] p-3! [&>.check-row]:text-sm [&_input:disabled]:bg-[#eee] [&_input:disabled]:text-[#999]">
            <label className="check-row">
              <input
                name="uniformFeeEnabled"
                type="checkbox"
                checked={uniformEnabled}
                onChange={(event) => setUniformEnabled(event.target.checked)}
              />{" "}
              Charge a uniform fee
            </label>
            <label>
              Uniform fee amount ($)
              <input
                name="uniformFee"
                type="number"
                min="0"
                max="100000"
                step="0.01"
                inputMode="decimal"
                defaultValue={division.uniformFee ?? ""}
                disabled={!uniformEnabled}
                required={uniformEnabled}
              />
            </label>
          </fieldset>
          <div className={`${uniformUploadGrid} mt-[2px]`}>
            <label>
              <span>
                Dark uniform <small>(optional)</small>
              </span>
              {division.darkImage ? (
                <img src={division.darkImage} alt={`${division.name} dark uniform`} />
              ) : (
                <i>
                  <Camera className="ui-icon" />
                </i>
              )}
              <input name="darkImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label>
              <span>
                Light uniform <small>(optional)</small>
              </span>
              {division.lightImage ? (
                <img src={division.lightImage} alt={`${division.name} light uniform`} />
              ) : (
                <i>
                  <Camera className="ui-icon" />
                </i>
              )}
              <input name="lightImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
          </div>
          <p className={fieldHelp}>
            Fees are required before invitations. Uniform photos are optional and can be added later
            for {division.name}.
          </p>
          <Feedback state={state} />
          <button className="btn secondary" disabled={pending}>
            {pending ? "Saving…" : "Save Fees & Uniforms"}
          </button>
        </form>
      </div>
    </details>
  );
}

function PreseasonSetupStep({
  season,
  previousDivisions,
}: {
  season: OwnerSeason;
  previousDivisions: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(completePreseasonDetailsAction, initialState);
  const ready = season.divisions.every((division) => division.preseasonConfigured);
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Before inviting players, save each division&apos;s league and optional uniform cost. You may
        reuse prior uniform photos or add new ones later.
      </p>
      {season.divisions.map((division) => (
        <PreseasonDivisionForm
          division={division}
          previousDivisions={previousDivisions}
          key={division.id}
        />
      ))}
      <form action={action} className={advanceStep}>
        <input type="hidden" name="seasonId" value={season.id} />
        <Feedback state={state} />
        <button className="btn primary" disabled={pending || !ready}>
          {pending
            ? "Saving…"
            : ready
              ? "Fees Complete — Continue"
              : "Save Fees for Every Division First"}
        </button>
        <small>Uniform photos can still be added after invitations begin.</small>
      </form>
    </div>
  );
}

function friendlyDate(date: string) {
  return date
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`))
    : "the response date selected below";
}

function DivisionInvitationForm({
  season,
  division,
  directory,
  open,
}: {
  season: OwnerSeason;
  division: OwnerDivision;
  directory: OwnerDirectoryPlayer[];
  open: boolean;
}) {
  const [state, action, pending] = useActionState(inviteDivisionPlayersAction, initialState);
  const [playersPerTeam, setPlayersPerTeam] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customized, setCustomized] = useState(false);
  const [selected, setSelected] = useState(() => new Set<string>());
  const teamCount = division.teams.length,
    targetPlayers = teamCount * playersPerTeam;
  const captainNames = new Set(
    division.teams
      .flatMap((team) => [team.captain, team.coCaptain])
      .filter((name) => name && name !== "Unassigned"),
  );
  const captainCount = directory.filter((player) => captainNames.has(player.name)).length;
  const optionalCosts = [
    division.leagueFeeEnabled && division.leagueFee !== null
      ? `League fee: ${money(division.leagueFee)}`
      : "",
    division.uniformFeeEnabled && division.uniformFee !== null
      ? `Uniform fee: ${money(division.uniformFee)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const suggested = `🏀 YOU'RE INVITED!\n\nJoin us for ${season.name} — ${division.name}. We are creating ${teamCount} teams with ${playersPerTeam} players each, for ${targetPlayers} exciting roster spots.\n\nSeason dates: ${friendlyDate(season.startsOn)} to ${friendlyDate(season.endsOn)}.${optionalCosts ? `\n\n${optionalCosts}` : ""}\n\nPlease respond by ${friendlyDate(deadline)}. We hope to see you on the court—bring your energy, teamwork, and love of the game!`;
  const message = customized ? customMessage : suggested;
  if (division.rosterFinalPublished)
    return (
      <details className={`${divisionInvitation} ${invitationSent}`} open={open}>
        <summary>
          <span>
            <b>{division.name}</b>
            <small>{division.invitationCount} invited · Final roster published</small>
          </span>
          <em>LOCKED</em>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="grid gap-1 border-t border-line bg-[#f7f7f6] p-[13px] [&_small]:text-[10px] [&_small]:leading-[1.4] [&_small]:text-muted">
          <b>Invitation list locked</b>
          <small>
            This division&apos;s final roster is published, so no further players can be invited or
            added.
          </small>
        </div>
      </details>
    );
  return (
    <details
      className={`${divisionInvitation} ${division.invitationSent ? invitationSent : invitationPending}`}
      open={open}
    >
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {division.invitationSent
              ? `${division.invitationCount} invited in latest batch · Respond by ${division.invitationDeadline}`
              : "Invitation not sent"}
          </small>
        </span>
        <em>{division.invitationSent ? "SENT" : "TO DO"}</em>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={action} className={`${ownerForm} border-t border-line p-[13px]`}>
        <input type="hidden" name="divisionId" value={division.id} />
        <section className="grid grid-cols-3 gap-[7px] [&>span]:grid [&>span]:gap-[3px] [&>span]:rounded-[10px] [&>span]:bg-[#f7f7f6] [&>span]:p-[9px_5px] [&>span]:text-center [&_small]:text-[8px] [&_small]:font-[800] [&_small]:text-muted [&_b]:text-[17px]">
          <span>
            <small>TEAMS</small>
            <b>{teamCount}</b>
          </span>
          <span>
            <small>PLAYERS / TEAM</small>
            <b>{playersPerTeam}</b>
          </span>
          <span>
            <small>SELECTED</small>
            <b>{selected.size + captainCount}</b>
          </span>
        </section>
        <p className={fieldHelp}>
          {captainCount
            ? `${captainCount} captain${captainCount === 1 ? " is" : "s are"} already counted. Select the additional players who should receive this invitation.`
            : "Choose the players who should receive this division invitation."}
        </p>
        <label>
          Choose players to invite <small>(nobody is selected by default)</small>
        </label>
        <div className="grid max-h-[315px] gap-[6px] overflow-auto rounded-[13px] border border-line bg-[#fbfaf8] p-[3px] [&_label]:grid [&_label]:cursor-pointer [&_label]:grid-cols-[22px_minmax(0,1fr)] [&_label]:items-center [&_label]:gap-2 [&_label]:rounded-[10px] [&_label]:p-[9px] [&_label.selected]:bg-[#fff4da] [&_input]:h-[17px] [&_input]:w-[17px] [&_label_span]:grid [&_label_span]:gap-[2px] [&_label_b]:text-[13px] [&_label_small]:truncate [&_label_small]:text-[10px] [&_label_small]:text-muted">
          {directory.map((player) => {
            const checked = selected.has(player.id);
            return (
              <label key={player.id} className={checked ? "selected" : ""}>
                <input
                  name="playerId"
                  type="checkbox"
                  value={player.id}
                  checked={checked}
                  onChange={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(player.id)) next.delete(player.id);
                      else next.add(player.id);
                      return next;
                    })
                  }
                />
                <span>
                  <b>{player.name}</b>
                  <small>
                    {player.email || "No email"} · Div: {player.divisionsJoined}
                  </small>
                </span>
              </label>
            );
          })}
          {!directory.length && (
            <p className={emptyNote}>Add KCH players to this conference directory first.</p>
          )}
        </div>
        <label>
          How many players per team?
          <input
            name="playersPerTeam"
            type="number"
            min="1"
            max="30"
            value={playersPerTeam}
            onChange={(event) =>
              setPlayersPerTeam(Math.min(30, Math.max(1, Number(event.target.value) || 1)))
            }
            required
          />
        </label>
        <label>
          When must players respond?
          <input
            name="responseDeadline"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            required
          />
        </label>
        <label>
          Invitation flyer <small>(optional)</small>
          <input name="flyer" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        <p className={fieldHelp}>
          Only the checked players receive this division invitation. Earlier invite responses are
          preserved.
        </p>
        <label>
          Invitation message
          <textarea
            name="message"
            maxLength={1000}
            value={message}
            onChange={(event) => {
              setCustomized(true);
              setCustomMessage(event.target.value);
            }}
            required
          />
        </label>
        {customized && (
          <button
            type="button"
            className="cursor-pointer justify-self-start border-0 bg-none p-0 font-[750] text-blue"
            onClick={() => setCustomized(false)}
          >
            Restore suggested message
          </button>
        )}
        <Feedback state={state} />
        <button
          className="btn primary"
          disabled={pending || !deadline || teamCount < 1 || !selected.size}
        >
          {pending
            ? "Sending…"
            : `Send to ${selected.size} Selected Player${selected.size === 1 ? "" : "s"}`}
        </button>
      </form>
      {division.invitationSent && <DivisionJoinLink divisionId={division.id} />}
    </details>
  );
}

function InvitePlayersSetupStep({
  season,
  directory,
}: {
  season: OwnerSeason;
  directory: OwnerDirectoryPlayer[];
}) {
  const firstUnsent = season.divisions.findIndex((division) => !division.invitationSent);
  const sent = season.divisions.filter((division) => division.invitationSent).length;
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Choose exactly who receives each division invitation. This workspace stays open during
        drafting, so you can add a new KCH player later without disturbing earlier responses.
      </p>
      <div className="grid gap-[3px] rounded-[13px] bg-[#f6f1e8] p-[12px_14px] [&>b]:text-sm [&>span]:text-[11px] [&>span]:text-muted">
        <b>
          {sent} of {season.divisions.length} divisions sent
        </b>
        <span>
          {sent === season.divisions.length
            ? "Invitations are active. You can still add individual players below."
            : "Complete the highlighted division next."}
        </span>
      </div>
      {season.divisions.map((division, index) => (
        <DivisionInvitationForm
          key={division.id}
          season={season}
          division={division}
          directory={directory}
          open={index === (firstUnsent < 0 ? 0 : firstUnsent)}
        />
      ))}
    </div>
  );
}

const sheetSafe = (value: string | number) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
function downloadDivisionDraftSheet(season: OwnerSeason, division: OwnerDivision) {
  const invitees = season.invitees.filter((invitee) => invitee.divisionId === division.id);
  const groups = [
    ["DRAFT POOL", invitees.filter((item) => item.selectionStatus === "eligible")],
    ["WAITLIST", invitees.filter((item) => item.selectionStatus === "waitlisted")],
    ["AWAITING RESPONSE", invitees.filter((item) => item.response === "pending")],
    ["NOT JOINING", invitees.filter((item) => item.response === "not_joining")],
  ] as const;
  const teamRows = division.teams
    .map(
      (team, index) =>
        `<tr><td>${index + 1}</td><td>${sheetSafe(team.name)}</td><td>${sheetSafe(team.captain)}</td><td>${sheetSafe(team.coCaptain)}</td><td></td><td></td><td></td><td></td></tr>`,
    )
    .join("");
  const playerSections = groups
    .map(
      ([label, players]) =>
        `<tr class="section"><td colspan="5">${label} (${players.length})</td></tr><tr class="headers"><td>#</td><td>Player Name</td><td>Jersey #</td><td>Position</td><td>Notes</td></tr>${players.map((player, index) => `<tr><td>${index + 1}</td><td>${sheetSafe(player.name)}</td><td>${player.jerseyNumber ?? ""}</td><td>${sheetSafe(player.position)}</td><td></td></tr>`).join("") || '<tr><td colspan="5">None</td></tr>'}`,
    )
    .join("");
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#08243e}h1{font-size:22px;margin-bottom:3px}p{margin:2px 0 12px;color:#566579}table{border-collapse:collapse;width:100%}td{border:1px solid #cfd6dd;padding:7px;font-size:11px}.title td{background:#08243e;color:white;font-size:13px;font-weight:bold}.section td{background:#f0a21a;color:white;font-weight:bold}.headers td{background:#e8eef5;font-weight:bold}</style></head><body><h1>KCH Draft Worksheet</h1><p>${sheetSafe(season.name)} · ${sheetSafe(division.name)} · ${sheetSafe(season.startsOn)} to ${sheetSafe(season.endsOn)}</p><table><tr class="title"><td>#</td><td>Team</td><td>Captain</td><td>Co-captain</td><td>Notes</td></tr>${teamRows.replace(/<td><\/td><td><\/td><td><\/td>/g, "<td></td>")}<tr><td colspan="5"></td></tr>${playerSections}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }),
    url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `${season.name}-${division.name}-draft-sheet.xls`
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-");
  link.click();
  URL.revokeObjectURL(url);
}

/* Draft review and the responded-player list. Both render only part-way
   through season setup, in data no conference in the suite has, so these are
   transcribed rather than photographed - see "Carried by hand" in
   MIGRATION.md. */
const draftReview =
  "block overflow-hidden rounded-xl border border-line bg-[#fafafa] [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[minmax(0,1fr)_auto_12px] [&>summary]:items-center [&>summary]:gap-[7px] [&>summary]:p-[11px] [&>summary::-webkit-details-marker]:hidden [&>summary>span]:grid [&>summary>span]:gap-[3px] [&_small]:text-[10px] [&_small]:text-muted [&>summary>em]:self-center [&>summary>em]:rounded-[9px] [&>summary>em]:p-[5px_7px] [&>summary>em]:text-[8px] [&>summary>em]:font-[850] [&>summary>em]:uppercase [&>summary>em]:not-italic [&>summary>strong]:transition-transform group-open:[&>summary>strong]:rotate-90";
const draftReviewTone: Record<string, string> = {
  approved: "[&>summary>em]:bg-[#dff3df] [&>summary>em]:text-green",
  changes_requested: "[&>summary>em]:bg-[#f7e6e6] [&>summary>em]:text-[#a62424]",
  editing: "[&>summary>em]:bg-[#edf0f3] [&>summary>em]:text-muted",
};
const draftReviewPending = "[&>summary>em]:bg-[#fff4da] [&>summary>em]:text-[#795009]";
const handoffNote = "m-0 rounded-[9px] bg-[#fff4da] p-[9px] text-[10px] leading-[1.45]";

function TeamDraftReview({
  team,
  allowChanges = false,
}: {
  team: OwnerTeam;
  allowChanges?: boolean;
}) {
  const [state, action, pending] = useActionState(reviewTeamRosterAction, initialState);
  const playerCount = team.players.filter((player) => player.status !== "inactive").length;
  const statusLabel =
    team.draftStatus === "approved"
      ? "Approved"
      : team.draftStatus === "submitted"
        ? "Pending approval"
        : team.draftStatus === "changes_requested"
          ? "Changes requested"
          : "Captain update pending";
  const roster = team.players.filter((player) => player.status !== "inactive");
  return (
    <details
      className={`group ${draftReview} ${draftReviewTone[team.draftStatus] ?? draftReviewPending}`}
    >
      <summary>
        <span>
          <b>{team.name}</b>
          <small>
            {team.captain} · {playerCount} players
          </small>
        </span>
        <em>{statusLabel}</em>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="grid gap-[9px] border-t border-line p-[0_11px_11px] pt-[10px]">
        <div className="col-span-full grid rounded-[10px] border border-line bg-white px-[9px] [&>span]:grid [&>span]:grid-cols-[25px_minmax(0,1fr)] [&>span]:items-center [&>span]:gap-2 [&>span]:border-t [&>span]:border-line [&>span]:py-2 [&>span:first-child]:border-t-0 [&>span>b]:text-center [&>span>b]:text-[10px] [&>span>b]:text-gold [&>span>span]:grid [&>span>span]:gap-[2px] [&_strong]:text-xs [&_strong]:leading-[1.35] [&_small]:text-[9px] [&_small]:[overflow-wrap:anywhere] [&_small]:text-muted">
          {roster.map((player, index) => {
            const designation =
              player.role !== "Player" ? `${player.role} / ${player.position}` : player.position;
            return (
              <span key={player.registrationId}>
                <b>{index + 1}</b>
                <span>
                  <strong>
                    {player.name} — {designation} — #{player.jerseyNumber}
                  </strong>
                  <small>
                    Uniform {player.uniformSize || "size pending"} ·{" "}
                    {[player.mobile, player.email].filter(Boolean).join(" · ") ||
                      "Contact unavailable"}
                  </small>
                </span>
              </span>
            );
          })}
          {!roster.length && <p className={emptyNote}>No players assigned to this team.</p>}
        </div>
        {(team.draftStatus === "submitted" ||
          (allowChanges && team.draftStatus === "approved")) && (
          <form action={action} className="col-span-full">
            <input type="hidden" name="teamId" value={team.id} />
            <Feedback state={state} />
            <div className={`${reviewActions} ${reviewActionsCompact}`}>
              <button
                className="btn secondary"
                name="decision"
                value="changes_requested"
                disabled={pending}
              >
                Request Change
              </button>
              {team.draftStatus === "submitted" && (
                <button className="btn primary" name="decision" value="approved" disabled={pending}>
                  Approve
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </details>
  );
}

function RosterRequestReview({ request }: { request: OwnerRosterRequest }) {
  const [state, action, pending] = useActionState(reviewRosterChangeRequestAction, initialState);
  return (
    <article className="rounded-xl border border-line p-[11px] [&>header]:grid [&>header]:grid-cols-[1fr_auto] [&>header]:gap-2 [&>header_span]:grid [&>header_span]:gap-[3px] [&_small]:text-[10px] [&_small]:text-muted [&_em]:text-[9px] [&_em]:uppercase [&_em]:not-italic [&_em]:text-gold [&>p]:text-[11px] [&>p]:leading-[1.45]">
      <header>
        <span>
          <b>{request.teamName}</b>
          <small>
            {request.seasonName} · {request.type.replace("_", " ")}
          </small>
        </span>
        <em>{request.status}</em>
      </header>
      <p>{request.details}</p>
      {request.ownerNote && (
        <p className="rounded-lg bg-[#fff4da] p-2">Owner: {request.ownerNote}</p>
      )}
      {request.status === "pending" && (
        <form action={action} className={ownerForm}>
          <input type="hidden" name="requestId" value={request.id} />
          <label>
            Owner note
            <textarea
              name="ownerNote"
              maxLength={1000}
              placeholder="Required when declining; optional when approving"
            />
          </label>
          <Feedback state={state} />
          <div className={reviewActions}>
            <button className="btn secondary" name="decision" value="declined" disabled={pending}>
              Decline
            </button>
            <button className="btn primary" name="decision" value="approved" disabled={pending}>
              Approve
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export function OwnerRosterChangeReviews({ requests }: { requests: OwnerRosterRequest[] }) {
  if (!requests.length) return null;
  const pending = requests.filter((request) => request.status === "pending");
  return (
    <details
      className={`card ${ownerSection} group overflow-hidden p-0! [&>summary]:grid [&>summary]:min-h-[64px] [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[minmax(0,1fr)_auto_24px] [&>summary]:items-center [&>summary]:gap-3 [&>summary]:p-[18px] [&>summary::-webkit-details-marker]:hidden [&>summary_span]:grid [&>summary_span]:gap-[5px] [&>summary_b]:text-lg [&>summary_small]:text-[13px] [&>summary_small]:text-muted [&>summary>strong]:grid [&>summary>strong]:place-items-center [&>summary>strong]:transition-transform group-open:[&>summary>strong]:rotate-90 [&>div]:grid [&>div]:gap-2 [&>div]:p-[0_14px_14px]`}
      open={pending.length > 0}
    >
      <summary>
        <span>
          <b>Captain Change Requests</b>
          <small>{pending.length} awaiting owner approval</small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div>
        {requests.slice(0, 10).map((request) => (
          <RosterRequestReview key={request.id} request={request} />
        ))}
      </div>
    </details>
  );
}

function UnassignedPlayerForm({ seasons }: { seasons: OwnerSeason[] }) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignUnassignedPlayerAction,
    initialState,
  );
  const [selectedDivisionId, setSelectedDivisionId] = useState(""),
    [selectedInvitationId, setSelectedInvitationId] = useState(""),
    [selectedAssignmentTeamId, setSelectedAssignmentTeamId] = useState("");
  const assignmentDivisions = seasons
    .filter((season) => !season.canceledAt)
    .flatMap((season) =>
      season.divisions.map((division) => ({
        id: division.id,
        label: `${season.name} — ${division.name}`,
        teams: division.teams.filter((team) => team.active),
        players: division.unassignedPlayers,
      })),
    );
  const selectedAssignmentDivision = assignmentDivisions.find(
    (division) => division.id === selectedDivisionId,
  );
  if (!assignmentDivisions.some((division) => division.teams.length)) return null;
  return (
    <details
      className={`card ${ownerSection} [&>summary]:cursor-pointer [&>summary]:list-none [&>summary::-webkit-details-marker]:hidden`}
    >
      <summary>
        <span className={sectionTitle}>
          <span className={ownerIcon}>
            <Plus className="ui-icon" />
          </span>
          <span>
            <h2>Add late invitation or move players</h2>
            <p>
              Later registrants, un drafted players and players without team can be assigned here
            </p>
          </span>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </span>
      </summary>
      <form action={assignAction} className={ownerForm}>
        <label>
          Division
          <select
            value={selectedDivisionId}
            onChange={(event) => {
              setSelectedDivisionId(event.target.value);
              setSelectedInvitationId("");
              setSelectedAssignmentTeamId("");
            }}
            required
          >
            <option value="" disabled>
              Select division
            </option>
            {assignmentDivisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Unassigned player
          <select
            name="registrationId"
            value={selectedInvitationId}
            onChange={(event) => setSelectedInvitationId(event.target.value)}
            required
            disabled={!selectedAssignmentDivision || !selectedAssignmentDivision.players.length}
          >
            <option value="" disabled>
              {!selectedAssignmentDivision
                ? "Select division first"
                : selectedAssignmentDivision.players.length
                  ? "Select player"
                  : "No unassigned players"}
            </option>
            {selectedAssignmentDivision?.players.map((player) => (
              <option key={player.registrationId} value={player.registrationId}>
                {player.name} · {player.publicPlayerId}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assign to team
          <select
            name="teamId"
            value={selectedAssignmentTeamId}
            onChange={(event) => setSelectedAssignmentTeamId(event.target.value)}
            required
            disabled={!selectedAssignmentDivision || !selectedAssignmentDivision.teams.length}
          >
            <option value="" disabled>
              {!selectedAssignmentDivision ? "Select division first" : "Select team"}
            </option>
            {selectedAssignmentDivision?.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <Feedback state={assignState} />
        <button
          className="btn secondary"
          disabled={
            assignPending ||
            !selectedInvitationId ||
            !selectedAssignmentTeamId ||
            !selectedAssignmentDivision
          }
        >
          {assignPending ? "Assigning…" : "Assign Player to Team"}
        </button>
      </form>
    </details>
  );
}

/* The season disclosure - four call sites across the teams, schedule and
   uniform workspaces - and the card nested inside it, which has five. Both
   were laid out from globals.css by child position; the values live here once
   rather than being restated at each site.

   The season kept no class of its own: owner-refinement re-scoped it from two
   ancestors to change one margin, and the margin is now stated where it
   differs. actionCard leaves its grid columns to the call site, which is the
   only thing the five disagree about.

   seasonSummary's third column is empty on purpose. globals.css declared three
   and every one of the four call sites has two children, so a season summary
   carries 24px and a gap of dead space after its caret. Reproduced rather than
   tidied: dropping it moves the caret, which is a visual change and not this
   one's to make. */
const seasonSummary =
  "grid min-h-[64px] cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_24px] items-center gap-[12px] p-[18px] [&::-webkit-details-marker]:hidden";
const seasonPanel = "border-t border-line p-[14px] max-tiny:p-[11px]";
const actionCard = "group mb-[10px] overflow-hidden rounded-[15px] border border-line bg-white";
const actionSummary =
  "grid min-h-[70px] cursor-pointer list-none items-center gap-[12px] p-[13px] [&::-webkit-details-marker]:hidden";
const caret = "text-[25px] transition-transform group-open:rotate-90";

function OwnerTeamsWorkspace({
  seasons,
  requests,
}: {
  seasons: OwnerSeason[];
  requests: OwnerRosterRequest[];
}) {
  const available = [...seasons]
    .filter((season) => !season.canceledAt)
    .sort((left, right) => right.startsOn.localeCompare(left.startsOn));
  return (
    <section className={`${ownerOperations} ${pageSection}`}>
      <p className={operationsIntro}>
        Open a season, then a division, to see each team&apos;s simple roster.
      </p>
      {available.length ? (
        <div className="grid gap-[11px]">
          {available.map((season, index) => (
            <details
              className="card group mb-[12px] overflow-hidden"
              key={season.id}
              open={index === 0}
            >
              <summary className={seasonSummary}>
                <span className="grid gap-[5px]">
                  <b className="text-[18px]">{season.name}</b>
                  <small className="text-[13px] text-muted">
                    {season.divisions.reduce((total, division) => total + division.teams.length, 0)}{" "}
                    teams · {season.divisions.length} division
                    {season.divisions.length === 1 ? "" : "s"}
                  </small>
                </span>
                <strong aria-hidden="true" className={caret}>
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div className={seasonPanel}>
                {season.divisions.map((division) => (
                  <details className={actionCard} key={division.id}>
                    <summary className={`${actionSummary} grid-cols-[44px_1fr_auto]`}>
                      <span className={ownerIcon}>
                        <Users className="ui-icon" />
                      </span>
                      <span className="grid gap-[4px]">
                        <b className="text-[15px]">{division.name}</b>
                        <small className="text-[13px] leading-[1.35] text-muted">
                          {division.teams.length} team{division.teams.length === 1 ? "" : "s"}
                        </small>
                      </span>
                      <strong aria-hidden="true" className={caret}>
                        <ChevronRight className="go-caret" />
                      </strong>
                    </summary>
                    <div className={gameForm}>
                      <div className="grid gap-[8px]">
                        {division.teams.length ? (
                          division.teams.map((team) => <TeamEditor key={team.id} team={team} />)
                        ) : (
                          <p className={emptyNote}>No teams in this division yet.</p>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className={emptyNote}>No active seasons yet. Create a season from Home first.</p>
      )}
      <OwnerRosterChangeReviews requests={requests} />
    </section>
  );
}

function DirectoryPlayer({
  conferenceId,
  player,
}: {
  conferenceId: string;
  player: OwnerDirectoryPlayer;
}) {
  const [state, action, pending] = useActionState(setConferencePlayerStatusAction, initialState);
  return (
    <details className={directoryStyles.player}>
      <summary>
        <b>{player.name}</b>
        <span className={directoryStyles.details}>{player.publicPlayerId}</span>
        <em className={directoryStyles[player.status]}>{player.status}</em>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className={directoryStyles.playerDetails}>
        <p>
          <span>Phone</span>
          {player.mobile || "—"}
        </p>
        <p>
          <span>Email</span>
          {player.email || "—"}
        </p>
        <p>
          <span>Divisions</span>
          {player.divisionsJoined}
        </p>
        <form action={action} className={directoryStyles.statusActions}>
          <input type="hidden" name="conferenceId" value={conferenceId} />
          <input type="hidden" name="playerId" value={player.id} />
          <button
            className={player.status === "active" ? directoryStyles.selected : ""}
            name="status"
            value="active"
            disabled={pending}
          >
            Active
          </button>
          <button
            className={player.status === "suspended" ? directoryStyles.selected : ""}
            name="status"
            value="suspended"
            disabled={pending}
          >
            Suspend
          </button>
          <button
            className={player.status === "inactive" ? directoryStyles.selected : ""}
            name="status"
            value="inactive"
            disabled={pending}
          >
            Inactive
          </button>
        </form>
        <Feedback state={state} />
      </div>
    </details>
  );
}
export function OwnerPlayerDirectoryManagement({
  conferenceId,
  directory,
  seasons,
  requests,
  view = "teams",
}: {
  conferenceId: string;
  directory: OwnerDirectoryPlayer[];
  seasons: OwnerSeason[];
  requests: OwnerRosterRequest[];
  view?: "teams" | "directory";
}) {
  if (view === "directory") {
    const playing = directory.filter((player) => player.playingThisSeason).length,
      active = directory.filter((player) => player.status === "active").length;
    return (
      <>
        <section className={styles.directoryHeading}>
          <p>
            {directory.length} player{directory.length === 1 ? "" : "s"} in this conference
            directory.
          </p>
        </section>
        <div className={directoryStyles.stats}>
          <span>
            <small>TOTAL</small>
            <b>{directory.length}</b>
          </span>
          <span>
            <small>PLAYING</small>
            <b>{playing}</b>
          </span>
          <span>
            <small>ACTIVE</small>
            <b>{active}</b>
          </span>
          <span>
            <small>INACTIVE</small>
            <b>{directory.length - active}</b>
          </span>
        </div>
        <UnassignedPlayerForm seasons={seasons} />
        <section className={`card player-directory-list ${ownerSection}`}>
          {directory.length ? (
            <div className={directoryStyles.list}>
              {directory.map((player) => (
                <DirectoryPlayer conferenceId={conferenceId} player={player} key={player.id} />
              ))}
            </div>
          ) : (
            <p className={emptyNote}>No KCH players have been added to this conference yet.</p>
          )}
        </section>
      </>
    );
  }
  return <OwnerTeamsWorkspace seasons={seasons} requests={requests} />;
}

function DivisionRespondedPlayers({ players }: { players: OwnerSeason["invitees"] }) {
  const [filter, setFilter] = useState<"all" | "joining" | "waitlist">("all");
  const visible =
    filter === "joining"
      ? players.filter(
          (player) => player.response === "joining" && player.selectionStatus !== "waitlisted",
        )
      : filter === "waitlist"
        ? players.filter((player) => player.selectionStatus === "waitlisted")
        : players;
  return (
    <details className="group overflow-hidden rounded-[13px] border border-line bg-white [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[1fr_auto] [&>summary]:items-center [&>summary]:bg-[#f7f7f6] [&>summary]:p-3 [&>summary::-webkit-details-marker]:hidden [&>summary>span]:grid [&>summary>span]:gap-[3px] [&>summary_small]:text-[10px] [&>summary_small]:text-muted [&>summary>strong]:transition-transform group-open:[&>summary>strong]:rotate-90 [&_article]:grid [&_article]:grid-cols-[28px_minmax(0,1fr)_auto] [&_article]:items-center [&_article]:gap-2 [&_article]:border-t [&_article]:border-line [&_article]:p-[10px_11px] [&_article>b]:grid [&_article>b]:h-[25px] [&_article>b]:w-[25px] [&_article>b]:place-items-center [&_article>b]:rounded-lg [&_article>b]:bg-[#fff4da] [&_article>b]:text-[10px] [&_article>b]:text-[#9a6100] [&_article>span]:grid [&_article>span]:min-w-0 [&_article>span]:gap-[2px] [&_article_strong]:truncate [&_article_strong]:text-[13px] [&_article_small]:text-[9px] [&_article_small]:text-muted [&_article_em]:rounded-lg [&_article_em]:bg-[#dff3df] [&_article_em]:p-[5px_6px] [&_article_em]:text-[8px] [&_article_em]:font-[800] [&_article_em]:uppercase [&_article_em]:not-italic [&_article_em]:text-green [&_article_em.waitlisted]:bg-[#fff4da] [&_article_em.waitlisted]:text-[#795009] [&_article_em.declined]:bg-[#f7e6e6] [&_article_em.declined]:text-[#a62424]">
      <summary>
        <span>
          <b>Responded Players</b>
          <small>{players.length} responses · Tap to view the draft list</small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="grid grid-cols-3 gap-[6px] p-[10px_11px] [&>button]:min-h-[34px] [&>button]:rounded-[10px] [&>button]:border [&>button]:border-[#d6dbe2] [&>button]:bg-white [&>button]:text-[10px]! [&>button]:font-[750]! [&>button]:text-muted! [&>button.active]:border-navy [&>button.active]:bg-navy [&>button.active]:text-white! [&>button_b]:ml-[3px] [&>button_b]:text-[inherit]">
        <button
          type="button"
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All <b>{players.length}</b>
        </button>
        <button
          type="button"
          className={filter === "joining" ? "active" : ""}
          onClick={() => setFilter("joining")}
        >
          Joining{" "}
          <b>
            {
              players.filter(
                (player) =>
                  player.response === "joining" && player.selectionStatus !== "waitlisted",
              ).length
            }
          </b>
        </button>
        <button
          type="button"
          className={filter === "waitlist" ? "active" : ""}
          onClick={() => setFilter("waitlist")}
        >
          Waitlist{" "}
          <b>{players.filter((player) => player.selectionStatus === "waitlisted").length}</b>
        </button>
      </div>
      {visible.map((player, position) => (
        <article key={player.invitationId}>
          <b>{position + 1}</b>
          <span>
            <strong>{player.name}</strong>
            <small>{player.publicPlayerId}</small>
          </span>
          <em className={player.response === "not_joining" ? "declined" : player.selectionStatus}>
            {player.response === "not_joining"
              ? "Not joining"
              : player.selectionStatus === "waitlisted"
                ? "Waitlist"
                : "Joining"}
          </em>
        </article>
      ))}
      {!visible.length && <p className={emptyNote}>No players in this view.</p>}
    </details>
  );
}

function OwnerDraftOverride({
  division,
  players,
}: {
  division: OwnerDivision;
  players: OwnerSeason["invitees"];
}) {
  const [state, action, pending] = useActionState(assignDraftPlayerAction, initialState);
  const eligible = players.filter(
    (player) =>
      player.response === "joining" && player.selectionStatus === "eligible" && !player.teamId,
  );
  if (division.rosterFinalPublished) return null;
  return (
    <details className="my-3 overflow-hidden rounded-[14px] border border-[#e4bd78] bg-[#fffaf2] [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[minmax(0,1fr)_auto] [&>summary]:items-center [&>summary]:gap-[10px] [&>summary]:p-3 [&>summary::-webkit-details-marker]:hidden [&>summary_span]:grid [&>summary_span]:gap-1 [&>summary_b]:text-sm [&>summary_b]:text-[#8a5900] [&>summary_small]:text-[10px] [&>summary_small]:leading-[1.35] [&>summary_small]:text-muted [&>summary_strong]:text-[22px] [&>form]:border-t [&>form]:border-[#edd5a9] [&>form]:p-3">
      <summary>
        <span>
          <b>Owner override: assign a player</b>
          <small>
            Use only when you need to place a player for a captain. Every override is recorded in
            the owner activity history.
          </small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={action} className={ownerForm}>
        <label>
          Draft-pool player
          <select name="invitationId" defaultValue="" required>
            <option value="" disabled>
              Select eligible player
            </option>
            {eligible.map((player) => (
              <option key={player.invitationId} value={player.invitationId}>
                {player.name} · {player.publicPlayerId}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assign to team
          <select name="teamId" defaultValue="" required>
            <option value="" disabled>
              Select team
            </option>
            {division.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <div className={compactFields}>
          <label>
            Jersey number
            <input name="jerseyNumber" type="number" min="0" max="99" />
          </label>
          <label>
            Position
            <input name="position" maxLength={40} placeholder="Guard, Forward…" />
          </label>
        </div>
        <Feedback state={state} />
        <button className="btn secondary" disabled={pending || !eligible.length}>
          {pending
            ? "Assigning…"
            : eligible.length
              ? "Assign Player to Team"
              : "No unassigned eligible players"}
        </button>
      </form>
    </details>
  );
}

/* Roster review and publishing. The banner has three tones and the publish
   form is shared by three steps of the wizard. */
const rosterShared =
  "grid gap-1 rounded-xl border p-3 [&_small]:text-[9px] [&_small]:leading-[1.4]";
const rosterSharedTone = {
  shared: "border-[#cce6d0] bg-[#f3faf4] text-green [&_small]:text-[#47734c]",
  review: "border-[#efd18e] bg-[#fff9e9] text-[#a76700] [&_small]:text-[#47734c]",
  final: "border-[#cce6d0] bg-[#edf8ef] text-green [&_small]:text-[#47734c]",
};
const publishForm =
  "rounded-xl border border-[#f0cf91] bg-[#fffaf0] p-3 [&>small]:text-center [&>small]:text-[9px] [&>small]:leading-[1.4] [&>small]:text-muted";
const reviewForm = "[&_h4]:m-0 [&_p]:m-0 [&_p]:text-[11px] [&_p]:leading-[1.45] [&_p]:text-muted";

function DivisionRosterPublish({
  season,
  division,
}: {
  season: OwnerSeason;
  division: OwnerDivision;
}) {
  const [state, action, pending] = useActionState(publishDivisionRosterAction, initialState);
  const [deadlineState, deadlineAction, deadlinePending] = useActionState(
    setDivisionRosterReviewDeadlineAction,
    initialState,
  );
  const [finalState, finalAction, finalPending] = useActionState(
    publishDivisionFinalRosterAction,
    initialState,
  );
  const approved = division.teams.filter((team) => team.draftStatus === "approved").length,
    ready = division.teams.length > 0 && approved === division.teams.length;
  const today = new Date().toISOString().slice(0, 10),
    reviewComplete = Boolean(
      division.rosterReviewDeadline && division.rosterReviewDeadline <= today,
    );
  if (division.rosterFinalPublished)
    return (
      <section className={`${rosterShared} ${rosterSharedTone.final}`}>
        <b>
          <Check className="ui-icon" /> Final roster published for {division.name}
        </b>
        <small>Everyone joining this division can see the final team assignments.</small>
      </section>
    );
  if (division.rosterPublished && !division.rosterReviewDeadline)
    return (
      <form action={deadlineAction} className={`compact ${ownerForm} ${publishForm} ${reviewForm}`}>
        <input type="hidden" name="divisionId" value={division.id} />
        <label>
          Review deadline
          <input name="reviewDeadline" type="date" min={today} required />
        </label>
        <Feedback state={deadlineState} />
        <button className="btn primary" disabled={deadlinePending}>
          {deadlinePending ? "Saving…" : "Start Review"}
        </button>
      </form>
    );
  if (division.rosterPublished)
    return (
      <section className="grid gap-[10px]">
        <div className={`${rosterShared} ${rosterSharedTone.review}`}>
          <b>Roster review is open</b>
          <small>
            Players can review all {division.name} team assignments through{" "}
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
              new Date(`${division.rosterReviewDeadline}T00:00:00Z`),
            )}
            .
          </small>
        </div>
        {!ready && (
          <p className="text-[11px] leading-[1.45] text-muted">
            {division.teams.length - approved} updated team roster
            {division.teams.length - approved === 1 ? " is" : "s are"} waiting for approval.
          </p>
        )}
        <form action={finalAction} className={`${ownerForm} ${publishForm}`}>
          <input type="hidden" name="divisionId" value={division.id} />
          <label>
            Final roster message
            <textarea
              name="message"
              maxLength={1000}
              defaultValue={`The ${season.name} · ${division.name} final roster is now published. Open My Team to view every team assignment.`}
              required
            />
          </label>
          <Feedback state={finalState} />
          <button className="btn primary" disabled={finalPending || !reviewComplete || !ready}>
            {finalPending
              ? "Publishing…"
              : !ready
                ? "Approve Updated Rosters First"
                : reviewComplete
                  ? `Publish ${division.name} Final Roster`
                  : `Available After Review Deadline`}
          </button>
          <small>
            {reviewComplete
              ? "This sends the final roster to everyone joining this division."
              : "The final publish button opens when the review deadline arrives."}
          </small>
        </form>
      </section>
    );
  return (
    <form action={action} className={`${ownerForm} ${publishForm}`}>
      <input type="hidden" name="divisionId" value={division.id} />
      <label>
        Message to {division.name} players
        <textarea
          name="message"
          maxLength={1000}
          defaultValue={`The ${season.name} · ${division.name} roster is ready for review. Open My Team to view every team assignment and Payments to view your division fees.`}
          required
        />
      </label>
      <Feedback state={state} />
      <button className="btn primary" disabled={pending || !ready}>
        {pending
          ? "Sharing rosters…"
          : ready
            ? `Share ${division.name} Rosters for Review`
            : `${division.teams.length - approved} Team${division.teams.length - approved === 1 ? "" : "s"} Pending Approval`}
      </button>
      <small>
        {ready
          ? "Only this division will be shared."
          : "Approve every team in this division to unlock sharing."}
      </small>
    </form>
  );
}

function DraftSetupStep({ season }: { season: OwnerSeason }) {
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Each division completes roster review and final publication independently. A pending team in
        one division will not block another division.
      </p>
      {season.divisions.map((division, index) => {
        const divisionInvitees = season.invitees.filter(
            (invitee) => invitee.divisionId === division.id,
          ),
          responded = divisionInvitees.filter((invitee) => invitee.response !== "pending"),
          joining = responded.filter((invitee) => invitee.response === "joining"),
          notJoining = responded.filter((invitee) => invitee.response === "not_joining"),
          waitlisted = joining.filter((invitee) => invitee.selectionStatus === "waitlisted"),
          divisionStatus = division.rosterFinalPublished
            ? "Final roster published"
            : division.rosterReviewDeadline
              ? "Roster review open"
              : division.rosterPublished
                ? "Set review deadline"
                : `${divisionInvitees.length} invited · ${responded.length} responded · ${joining.length} joining · ${waitlisted.length} waitlisted`;
        return (
          <details
            className="overflow-hidden rounded-[14px] border border-line bg-white [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:grid-cols-[1fr_auto] [&>summary]:items-center [&>summary]:gap-[10px] [&>summary]:p-[13px] [&>summary_span]:grid [&>summary_span]:gap-1 [&>summary_small]:text-[10px] [&>summary_small]:leading-[1.35] [&>summary_small]:text-muted [&>div]:grid [&>div]:gap-[9px] [&>div]:border-t [&>div]:border-line [&>div]:p-[13px] [&_h3]:m-[4px_0_0] [&_h3]:text-[13px] [&_h3]:text-gold"
            key={division.id}
            open={index === 0 || !division.rosterFinalPublished}
          >
            <summary>
              <span>
                <b>{division.name}</b>
                <small>{divisionStatus}</small>
              </span>
              <strong aria-hidden="true">
                <ChevronRight className="go-caret" />
              </strong>
            </summary>
            <div>
              <button
                type="button"
                className="btn primary min-h-[46px] w-full"
                onClick={() => downloadDivisionDraftSheet(season, division)}
              >
                <Download className="ui-icon" /> Download {division.name} Draft Sheet
              </button>
              <p className="m-0 text-center text-[10px] leading-[1.45] text-muted">
                The download remains available for owners who want a printed or computer-based
                draft.
              </p>
              <DivisionRespondedPlayers players={responded} />
              {notJoining.length > 0 && (
                <p className="m-0 text-[10px] leading-[1.45] text-muted">
                  Players marked “Not joining” remain visible under All so the owner has a complete
                  response record.
                </p>
              )}
              <OwnerDraftOverride division={division} players={divisionInvitees} />
              <div className="grid gap-2">
                {division.teams.map((team) => (
                  <TeamDraftReview
                    key={team.id}
                    team={team}
                    allowChanges={division.rosterPublished && !division.rosterFinalPublished}
                  />
                ))}
              </div>
              <DivisionRosterPublish season={season} division={division} />
            </div>
          </details>
        );
      })}
      <p className={handoffNote}>
        Players review every team assignment during the deadline window. Final rosters are then
        published separately for each division.
      </p>
    </div>
  );
}

function ScheduleSetupStep({ season }: { season: OwnerSeason }) {
  return (
    <div className="grid gap-[13px] border-t border-line p-[15px]">
      <p className={stepNote}>
        Open one division at a time. Choose manual scheduling or let KCH create a draft on the
        Schedule page.
      </p>
      <div className="grid gap-[9px]">
        {season.divisions.map((division) => {
          const games = season.games.filter((game) => game.divisionId === division.id).length;
          return (
            <article
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[8px] rounded-[14px] border border-line bg-white p-[12px] [&>span]:grid [&>span]:gap-[3px] [&>span_small]:text-[11px] [&>span_small]:text-muted [&>em]:rounded-full [&>em]:p-[5px_8px] [&>em]:text-[9px] [&>em]:font-[900] [&>em]:not-italic [&_.btn]:col-span-full [&_.btn]:flex [&_.btn]:min-h-[40px] [&_.btn]:items-center [&_.btn]:justify-center ${
                division.scheduleStatus === "final"
                  ? "[&>em]:bg-[#eaf6ec] [&>em]:text-green"
                  : division.scheduleStatus === "draft"
                    ? "[&>em]:bg-[#fff4da] [&>em]:text-[#8a5900]"
                    : "[&>em]:bg-[#eef1f4] [&>em]:text-[#5b6875]"
              }`}
              key={division.id}
            >
              <span>
                <b>{division.name}</b>
                <small>
                  {division.teams.length} teams · {games} games
                </small>
              </span>
              <em>
                {!division.rosterFinalPublished
                  ? "Roster not final"
                  : division.scheduleStatus === "final"
                    ? "Final"
                    : division.scheduleStatus === "draft"
                      ? "Draft"
                      : "Not started"}
              </em>
              {division.rosterFinalPublished ? (
                <a className="btn secondary" href={`/owner/schedule#division-${division.id}`}>
                  {division.scheduleStatus === "not_started"
                    ? "Choose Schedule Method"
                    : "View or Update"}
                </a>
              ) : (
                <button className="btn secondary" disabled>
                  Finish Roster First
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className={handoffNote}>
        Every division creates and finalizes its own schedule. One division never waits for another.
      </p>
    </div>
  );
}

function CancelSeasonForm({ season }: { season: OwnerSeason }) {
  const [state, action, pending] = useActionState(cancelSeasonAction, initialState);
  return (
    <details className="mt-2 border-t border-t-[rgba(255,255,255,0.2)] pt-2 [&>summary]:cursor-pointer [&>summary]:text-[10px] [&>summary]:text-[#ffd5d5] [&>form]:mt-[10px] [&>form]:rounded-xl [&>form]:bg-white [&>form]:p-3 [&>form]:text-navy">
      <summary>Cancel this season</summary>
      <form action={action} className={ownerForm}>
        <input type="hidden" name="seasonId" value={season.id} />
        <p className={fieldHelp}>
          The season will not be deleted. Its teams, rosters, responses, payments, and history
          remain preserved.
        </p>
        <label>
          Cancellation reason
          <textarea name="reason" maxLength={500} required />
        </label>
        <label className="check-row">
          <input name="confirm" type="checkbox" /> I understand this cancels the season for all
          teams.
        </label>
        <Feedback state={state} />
        <button
          className="btn border! border-[#e9b7b7]! bg-[#fff0f0]! text-[#a51118]!"
          disabled={pending}
        >
          {pending ? "Canceling…" : "Cancel Season"}
        </button>
      </form>
    </details>
  );
}

function ExpandExistingSeason({ season }: { season: OwnerSeason }) {
  const [state, action, pending] = useActionState(createDivisionsAction, initialState);
  const [divisionCount, setDivisionCount] = useState(1);
  const remaining = Math.max(0, 10 - season.divisions.length);
  const divisionsNeedingTeams = season.divisions.filter((division) => division.teams.length === 0);
  return (
    <details className="overflow-hidden rounded-[12px] border border-line [&>summary]:flex [&>summary]:cursor-pointer [&>summary]:items-center [&>summary]:justify-between [&>summary]:gap-[10px] [&>summary]:p-[12px] [&>summary_span]:grid [&>summary_small]:text-muted [&>div]:grid [&>div]:gap-[12px] [&>div]:p-[0_12px_12px]">
      <summary>
        <span>
          <b>{season.name}</b>
          <small>{season.divisions.length} of 10 divisions · Keep this season and expand it</small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div>
        {remaining > 0 ? (
          <form action={action} className={batchForm}>
            <input type="hidden" name="seasonId" value={season.id} />
            <label className={batchCountField}>
              How many new divisions?
              <input
                type="number"
                min="1"
                max={remaining}
                value={Math.min(divisionCount, remaining)}
                onChange={(event) =>
                  setDivisionCount(
                    Math.min(remaining, Math.max(1, Number(event.target.value) || 1)),
                  )
                }
              />
            </label>
            <div className={batchNameGrid}>
              {Array.from({ length: Math.min(divisionCount, remaining) }, (_, index) => (
                <label key={index}>
                  New division {index + 1}
                  <input name="divisionName" placeholder="Division name" maxLength={80} required />
                </label>
              ))}
            </div>
            <Feedback state={state} />
            <button className={`btn secondary ${batchSaveButton}`} disabled={pending}>
              {pending ? "Adding…" : "Add to This Season"}
            </button>
          </form>
        ) : (
          <p className={emptyNote}>This season already has the maximum of 10 divisions.</p>
        )}
        {divisionsNeedingTeams.length > 0 && (
          <section className="grid gap-2">
            <p className={stepNote}>New divisions ready for teams:</p>
            {divisionsNeedingTeams.map((division) => (
              <DivisionTeamBuilder key={division.id} division={division} />
            ))}
          </section>
        )}
      </div>
    </details>
  );
}

const setupLabels = [
  "Create Season",
  "Add Divisions",
  "Add Teams",
  "Assign Captains",
  "Fees & Uniforms",
  "Invite Players",
  "Draft Rosters",
  "Build Schedule",
];
/**
 * One step in the season setup wizard.
 *
 * It was four render sites: a details for the current step, a section for each
 * locked one, and the same pair again further down. All four wrote the same
 * grid, the same number bubble and the same status pill, and differed only in
 * whether the body could be opened.
 *
 * The two shapes are not interchangeable - a locked step has nothing to open,
 * so it stays a <section> with a <header> rather than a <details> nothing can
 * use. That distinction was already in the old markup; this keeps it.
 *
 * NOTE: `completed` and `available` are faithful translations of the old rules
 * but are NOT covered by a screenshot - no conference in the data reaches
 * either state, so nothing can diff them. Worth an eye if a season ever gets
 * partway through setup.
 */
const stepTone = {
  completed: {
    card: "border-line bg-[#fafafa]",
    number: "bg-[#dff3df] text-green",
    pill: "bg-[#e8f4e8] text-green",
  },
  current: {
    card: "border-[#e6b35c] bg-white/[0.94] shadow-[0_8px_22px_rgba(209,132,8,0.12)]",
    number: "bg-navy text-white",
    pill: "bg-[#fff4da] text-[#795009]",
  },
  available: {
    card: "border-line bg-white/[0.94]",
    number: "bg-[#e9eef4] text-navy",
    pill: "bg-[#eef3f8] text-[#486177]",
  },
  locked: {
    card: "border-line bg-white/[0.94] opacity-[0.58]",
    number: "bg-[#f0efed] text-muted",
    pill: "bg-[#eee] text-[#666]",
  },
} as const;

type StepTone = keyof typeof stepTone;

const stepRow = "grid grid-cols-[38px_1fr_auto] items-center gap-[11px] p-[13px_15px]";
const stepNumber = "grid h-[35px] w-[35px] place-items-center rounded-full";
const stepPill = "rounded-[9px] px-[7px] py-[5px] text-[9px] uppercase not-italic";

function GuidedStep({
  tone,
  step,
  label,
  status,
  badge,
  open,
  children,
}: {
  tone: StepTone;
  step: number;
  label: ReactNode;
  status: string;
  /** The number, or a tick once the step is done. */
  badge?: ReactNode;
  open?: boolean;
  children?: ReactNode;
}) {
  const t = stepTone[tone];
  const heading = (
    <>
      <b className={`${stepNumber} ${t.number}`}>{badge ?? step}</b>
      <span className="grid gap-[2px]">
        <small className="text-[9px] font-[800] text-muted">STEP {step} OF 8</small>
        <h2 className="m-0 text-[16px]">{label}</h2>
      </span>
      <span className="flex items-center gap-[7px]">
        <em className={`${stepPill} ${t.pill}`}>{status}</em>
        {tone !== "locked" && (
          <strong
            aria-hidden="true"
            className="text-[22px] transition-transform group-open:rotate-90"
          >
            <ChevronRight className="go-caret" />
          </strong>
        )}
      </span>
    </>
  );
  const shell = `overflow-hidden rounded-[17px] border ${t.card}`;

  // A locked step has no body, so it stays a section rather than a disclosure
  // nothing can open.
  if (tone === "locked")
    return (
      <section className={shell}>
        <header className={stepRow}>{heading}</header>
      </section>
    );
  return (
    <details className={`group ${shell}`} open={open}>
      <summary className={`${stepRow} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        {heading}
      </summary>
      {children}
    </details>
  );
}

export function OwnerSetupWizard({
  conferenceId,
  conferenceName,
  seasons,
  directory,
}: {
  conferenceId: string;
  conferenceName: string;
  seasons: OwnerSeason[];
  directory: OwnerDirectoryPlayer[];
}) {
  const activeSeason = seasons.find((season) => !season.canceledAt && season.setupStage < 7);
  if (!activeSeason) {
    const completed = seasons.filter((season) => season.setupStage === 7 && !season.canceledAt),
      published = seasons.filter((season) => season.setupStage === 7 || season.canceledAt);
    return (
      <div className="grid gap-[10px]">
        <GuidedStep tone="current" step={1} label="Season" status="Choose a path" open>
          <div className="grid gap-[13px] border-t border-line p-[15px]">
            <section className="grid gap-[10px] rounded-[14px] border border-line bg-white p-[13px] [&>h3]:m-0 [&>h3]:text-navy">
              <h3>Create a New Season</h3>
              <p className={stepNote}>Start a separate season inside {conferenceName}.</p>
              <CreateSeasonForm conferenceId={conferenceId} />
            </section>
            {completed.length > 0 && (
              <section className="grid gap-[10px] rounded-[14px] border border-line bg-white p-[13px] [&>h3]:m-0 [&>h3]:text-navy">
                <h3>Use the Same Season</h3>
                <p className={stepNote}>
                  Add another division after setup is complete. Existing divisions, teams, rosters,
                  payments, and schedules stay unchanged.
                </p>
                {completed.map((season) => (
                  <ExpandExistingSeason key={season.id} season={season} />
                ))}
              </section>
            )}
          </div>
        </GuidedStep>
        {setupLabels.slice(1).map((label, index) => (
          <GuidedStep tone="locked" step={index + 2} label={label} status="Locked" key={label} />
        ))}
        <div className="mb-[4px] grid gap-[6px] [&>span]:rounded-[12px] [&>span]:bg-[#e8f4e8] [&>span]:p-[10px_13px] [&>span]:text-[11px] [&>span]:font-[700] [&>span]:text-green">
          {published.map((season) => (
            <span
              className={season.canceledAt ? "bg-[#f6e8e8]! text-[#9b2525]!" : ""}
              key={season.id}
            >
              {season.canceledAt ? "×" : <Check className="ui-icon" />} {season.name}{" "}
              {season.canceledAt ? "canceled" : "published"}
            </span>
          ))}
        </div>
      </div>
    );
  }
  const everyDivisionRosterFinal =
    activeSeason.divisions.length > 0 &&
    activeSeason.divisions.every((division) => division.rosterFinalPublished);
  const currentVisualStep =
    activeSeason.setupStage <= 3
      ? activeSeason.setupStage + 1
      : activeSeason.setupStage === 4
        ? activeSeason.preseasonReady
          ? 6
          : 5
        : activeSeason.setupStage === 5 ||
            (activeSeason.setupStage >= 6 && !everyDivisionRosterFinal)
          ? 7
          : 8;
  const reviewFor = (step: number) =>
    step === 1 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        {activeSeason.name} · {activeSeason.startsOn} to {activeSeason.endsOn}
      </p>
    ) : step === 2 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        {activeSeason.divisions.length} division{activeSeason.divisions.length === 1 ? "" : "s"}{" "}
        added
      </p>
    ) : step === 3 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        {activeSeason.divisions.reduce((sum, division) => sum + division.teams.length, 0)} teams
        added
      </p>
    ) : step === 4 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        Captains and co-captains established
      </p>
    ) : step === 5 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        Division fees and dark/light uniforms prepared
      </p>
    ) : step === 6 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        {activeSeason.invitees.length} players invited ·{" "}
        {activeSeason.invitees.filter((invitee) => invitee.response === "joining").length} joining
      </p>
    ) : step === 7 ? (
      <p className="m-0 border-t border-line p-[13px_15px_13px_64px] text-[11px] text-muted">
        Roster draft published to players and captains
      </p>
    ) : null;
  const previousDivisions = seasons
    .filter((season) => season.id !== activeSeason.id)
    .flatMap((season) =>
      season.divisions.map((division) => ({
        id: division.id,
        label: `${season.name} — ${division.name}`,
      })),
    );
  const bodyFor = (step: number) =>
    step === 2 ? (
      <DivisionSetupStep season={activeSeason} />
    ) : step === 3 ? (
      <TeamsSetupStep season={activeSeason} />
    ) : step === 4 ? (
      <CaptainsSetupStep season={activeSeason} directory={directory} />
    ) : step === 5 ? (
      <PreseasonSetupStep season={activeSeason} previousDivisions={previousDivisions} />
    ) : step === 6 ? (
      <InvitePlayersSetupStep season={activeSeason} directory={directory} />
    ) : step === 7 ? (
      <DraftSetupStep season={activeSeason} />
    ) : step === 8 ? (
      <ScheduleSetupStep season={activeSeason} />
    ) : null;
  return (
    <div className="grid gap-[10px]">
      <section className="mb-[4px] grid gap-[4px] rounded-[16px] bg-[linear-gradient(120deg,#08243e,#0a3767)] p-[16px_18px] text-white [&>small]:text-[10px] [&>small]:font-[800] [&>small]:text-[#f5a313] [&>b]:text-[22px] [&>span]:text-[11px] [&>span]:text-[#d7e0e9]">
        <small>{conferenceName} / SETTING UP</small>
        <b>{activeSeason.name}</b>
        <span>
          {activeSeason.startsOn} to {activeSeason.endsOn}
        </span>
        <CancelSeasonForm season={activeSeason} />
      </section>
      {setupLabels.map((label, index) => {
        const visualStep = index + 1;
        const completed = visualStep < currentVisualStep;
        const current = visualStep === currentVisualStep;
        const invitationWorkspace = visualStep === 6 && !everyDivisionRosterFinal;
        const locked = !completed && !current && !invitationWorkspace;
        const status =
          invitationWorkspace && completed
            ? "Active"
            : completed
              ? "Completed"
              : current
                ? "In progress"
                : "Locked";
        const tone = locked
          ? "locked"
          : completed
            ? "completed"
            : current
              ? "current"
              : "available";
        return (
          <GuidedStep
            key={label}
            tone={tone}
            step={visualStep}
            label={label}
            status={status}
            badge={completed && !invitationWorkspace ? <Check className="ui-icon" /> : undefined}
            open={current || invitationWorkspace}
          >
            {completed ? (
              <>
                {reviewFor(visualStep)}
                {invitationWorkspace && bodyFor(visualStep)}
              </>
            ) : (
              bodyFor(visualStep)
            )}
          </GuidedStep>
        );
      })}
    </div>
  );
}

type ManualGameRow = {
  id: number;
  homeTeamId: string;
  awayTeamId: string;
  time: string;
  court: string;
};
/* The schedule builder: the two method cards, the manual day form and the
   finalize panel. Most of these render only while a division's schedule is
   still a draft. */
const scheduleChoiceCard =
  "flex min-h-[150px] flex-col gap-2 rounded-[17px] border border-line bg-white p-[16px_13px] text-navy shadow-[0_5px_14px_rgba(13,38,69,0.06)] [&>span]:grid [&>span]:h-[38px] [&>span]:w-[38px] [&>span]:place-items-center [&>span]:rounded-xl [&>span]:bg-[#f2efeb] [&>span]:text-[21px] [&>span]:text-gold [&>b]:text-[15px] [&>b]:leading-[1.25] [&>small]:text-[11px] [&>small]:leading-[1.45] [&>small]:text-muted";
const scheduleMethodCard =
  "group mb-[9px] overflow-hidden rounded-[14px] border border-line bg-white [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[36px_1fr_18px] [&>summary]:items-center [&>summary]:gap-[9px] [&>summary]:p-[13px] [&>summary::-webkit-details-marker]:hidden [&>summary>span:first-child]:grid [&>summary>span:first-child]:h-9 [&>summary>span:first-child]:w-9 [&>summary>span:first-child]:place-items-center [&>summary>span:first-child]:rounded-[11px] [&>summary>span:first-child]:bg-[#f2efeb] [&>summary>span:first-child]:text-[19px] [&>summary>span:first-child]:text-gold [&>summary>span:nth-child(2)]:grid [&>summary>span:nth-child(2)]:gap-[3px] [&>summary_b]:text-[14px] [&>summary_small]:text-[11px] [&>summary_small]:leading-[1.4] [&>summary_small]:text-muted [&>summary>strong]:text-[20px] [&>summary>strong]:transition-transform group-open:[&>summary>strong]:rotate-90 [&>form]:border-t [&>form]:border-line [&>form]:p-[13px]";

function ManualGameDayBuilder({
  season,
  division,
}: {
  season: OwnerSeason;
  division: OwnerDivision;
}) {
  const [state, action, pending] = useActionState(saveDivisionGameDayAction, initialState);
  const [nextId, setNextId] = useState(2);
  const [rows, setRows] = useState<ManualGameRow[]>([
    { id: 1, homeTeamId: "", awayTeamId: "", time: "13:00", court: "Court 1" },
  ]);
  const teams = division.teams.filter((team) => team.active);
  const update = (id: number, key: keyof Omit<ManualGameRow, "id">, value: string) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  const add = () => {
    const last = rows.at(-1),
      [hour, minute] = (last?.time ?? "13:00").split(":").map(Number),
      date = new Date(Date.UTC(2000, 0, 1, hour, minute + 60));
    setRows((current) => [
      ...current,
      {
        id: nextId,
        homeTeamId: "",
        awayTeamId: "",
        time: `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`,
        court: last?.court ?? "Court 1",
      },
    ]);
    setNextId((value) => value + 1);
  };
  return (
    <form action={action} className={`${ownerForm} border-t border-line p-[13px]`}>
      <input type="hidden" name="divisionId" value={division.id} />
      <input
        type="hidden"
        name="gamesJson"
        value={JSON.stringify(
          rows.map(({ homeTeamId, awayTeamId, time, court }) => ({
            homeTeamId,
            awayTeamId,
            time,
            court,
          })),
        )}
      />
      <div className={compactFields}>
        <label>
          Game date
          <input name="gameDate" type="date" min={season.startsOn} max={season.endsOn} required />
        </label>
        <label>
          Minutes per game
          <input name="gameMinutes" type="number" min="30" max="180" defaultValue="60" required />
        </label>
      </div>
      <label>
        Venue
        <input name="venue" defaultValue="Kada Court Center" maxLength={120} required />
      </label>
      <p className={fieldHelp}>Each team can play only once on this game day.</p>
      <div className="grid gap-[9px] [&_fieldset]:relative [&_fieldset]:grid [&_fieldset]:grid-cols-2 [&_fieldset]:gap-[9px] [&_fieldset]:rounded-xl [&_fieldset]:border [&_fieldset]:border-line [&_fieldset]:p-3 [&_legend]:px-[5px] [&_legend]:text-xs [&_legend]:font-[900] [&_legend]:text-gold [&_label:nth-of-type(n+3)]:col-span-full">
        {rows.map((row, index) => (
          <fieldset key={row.id}>
            <legend>Game {index + 1}</legend>
            <label>
              Time
              <input
                type="time"
                value={row.time}
                onChange={(event) => update(row.id, "time", event.target.value)}
                required
              />
            </label>
            <label>
              Court
              <input
                value={row.court}
                onChange={(event) => update(row.id, "court", event.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label>
              Home team
              <select
                value={row.homeTeamId}
                onChange={(event) => update(row.id, "homeTeamId", event.target.value)}
                required
              >
                <option value="">Choose team</option>
                {teams.map((team) => (
                  <option value={team.id} key={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Away team
              <select
                value={row.awayTeamId}
                onChange={(event) => update(row.id, "awayTeamId", event.target.value)}
                required
              >
                <option value="">Choose team</option>
                {teams.map((team) => (
                  <option value={team.id} key={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            {rows.length > 1 && (
              <button
                type="button"
                className="col-span-full min-h-[34px] border-0 bg-transparent font-[800] text-[#a51118]"
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              >
                Remove
              </button>
            )}
          </fieldset>
        ))}
      </div>
      <button type="button" className="btn secondary w-full" onClick={add}>
        + Add Another Game
      </button>
      <Feedback state={state} />
      <button className="btn primary" disabled={pending || teams.length < 2}>
        {pending ? "Saving game day…" : "Save All Games This Day"}
      </button>
    </form>
  );
}

function KchDivisionScheduleBuilder({
  season,
  division,
}: {
  season: OwnerSeason;
  division: OwnerDivision;
}) {
  const [state, action, pending] = useActionState(generateDivisionScheduleAction, initialState);
  const matchupCount = (division.teams.length * (division.teams.length - 1)) / 2;
  const dailyMaximum = Math.max(
    1,
    Math.floor(division.teams.filter((team) => team.active).length / 2),
  );
  return (
    <form action={action} className={`${ownerForm} [&_textarea]:min-h-[80px]`}>
      <input type="hidden" name="divisionId" value={division.id} />
      <div className={compactFields}>
        <label>
          First game date
          <input
            name="firstGameDate"
            type="date"
            min={season.startsOn}
            max={season.endsOn}
            defaultValue={season.startsOn}
            required
          />
        </label>
        <label>
          First game time
          <input name="firstGameTime" type="time" defaultValue="13:00" required />
        </label>
      </div>
      <label>
        Venue
        <input name="venue" defaultValue="Kada Court Center" maxLength={120} required />
      </label>
      <fieldset className="grid grid-cols-4 gap-[6px] border-0 p-0 [&>legend]:mb-[7px] [&>legend]:text-[13px] [&>legend]:font-[800] [&_label]:relative [&_input]:absolute [&_input]:opacity-0 [&_span]:grid [&_span]:min-h-[40px] [&_span]:place-items-center [&_span]:rounded-[10px] [&_span]:border [&_span]:border-line [&_span]:bg-white [&_span]:text-[11px] [&_input:checked+span]:border-navy [&_input:checked+span]:bg-navy [&_input:checked+span]:text-white">
        <legend>Days played</legend>
        {[
          [0, "Sun"],
          [1, "Mon"],
          [2, "Tue"],
          [3, "Wed"],
          [4, "Thu"],
          [5, "Fri"],
          [6, "Sat"],
        ].map(([value, label]) => (
          <label key={value}>
            <input name="playingDay" type="checkbox" value={value} defaultChecked={value === 0} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <div className={compactFields}>
        <label>
          Number of courts
          <input name="courtCount" type="number" min="1" max="10" defaultValue="2" required />
        </label>
        <label>
          Minutes per game
          <input name="gameMinutes" type="number" min="30" max="180" defaultValue="60" required />
        </label>
      </div>
      <label>
        Maximum games per day
        <input
          name="gamesPerDay"
          type="number"
          min="1"
          max={dailyMaximum}
          defaultValue={dailyMaximum}
          required
        />
      </label>
      <p className={fieldHelp}>
        KCH schedules each team only once per day, even when more court time is available.
      </p>
      <label className="check-row">
        <input name="doubleRoundRobin" type="checkbox" /> Home and away double round-robin
      </label>
      <div className="grid grid-cols-3 gap-[7px] [&>span]:grid [&>span]:min-h-[64px] [&>span]:place-items-center [&>span]:rounded-xl [&>span]:border [&>span]:border-line [&>span]:bg-white [&>span]:p-[9px_6px] [&>span]:text-center [&>span]:text-[10px] [&>span]:text-muted [&_b]:text-sm [&_b]:text-navy">
        <span>
          <b>{matchupCount}</b> Matchups
        </span>
        <span>
          <b>{division.teams.length}</b> Teams
        </span>
        <span>
          <b>Draft</b> Review first
        </span>
      </div>
      <Feedback state={state} />
      <button className="btn primary" disabled={pending || matchupCount < 1}>
        {pending ? "Building draft…" : "Create KCH Draft Schedule"}
      </button>
    </form>
  );
}

function DivisionMatchupProgress({
  division,
  games,
}: {
  division: OwnerDivision;
  games: OwnerSeason["games"];
}) {
  const teams = division.teams.filter((team) => team.active),
    scheduled = new Set(
      games
        .filter((game) => game.phase === "regular" && game.status !== "canceled")
        .map((game) => [game.homeTeamId, game.awayTeamId].sort().join(":")),
    ),
    missing: Array<[OwnerTeam, OwnerTeam]> = [];
  for (let first = 0; first < teams.length; first++)
    for (let second = first + 1; second < teams.length; second++)
      if (!scheduled.has([teams[first].id, teams[second].id].sort().join(":")))
        missing.push([teams[first], teams[second]]);
  const total = (teams.length * (teams.length - 1)) / 2,
    complete = total - missing.length;
  return (
    <details
      className={`mb-[10px] overflow-hidden rounded-[13px] ${
        missing.length
          ? "border border-[#e4bd78] bg-[#fffaf2]"
          : "border border-[#bcdcbf] bg-[#edf8ef]"
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between p-[12px] [&::-webkit-details-marker]:hidden [&>span]:grid [&>span]:gap-[3px] [&_small]:text-[11px] [&_small]:text-muted">
        <span>
          <b>
            {missing.length ? `${missing.length} Matchups Still Needed` : "Round Robin Complete"}
          </b>
          <small>
            {complete} of {total} unique matchups scheduled
          </small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      {missing.length ? (
        <div className="grid gap-[6px] border-t border-line p-[10px] [&>span]:text-[11px]">
          {missing.map(([home, away]) => (
            <span key={`${home.id}-${away.id}`}>
              {home.name} <b>vs</b> {away.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="m-0 p-[0_12px_12px] text-[11px] text-green">
          Every team has been matched once. This draft can be finalized.
        </p>
      )}
    </details>
  );
}

function FinalizeDivisionSchedule({
  division,
  missingCount,
}: {
  division: OwnerDivision;
  missingCount: number;
}) {
  const [state, action, pending] = useActionState(finalizeDivisionScheduleAction, initialState);
  if (division.scheduleStatus === "final")
    return (
      <section className="mb-[10px] grid gap-[3px] rounded-[13px] border border-[#bcdcbf] bg-[#edf8ef] p-[12px] text-green [&_small]:text-[#47734c]">
        <b>
          <Check className="ui-icon" /> Final Schedule
        </b>
        <small>Players in {division.name} can now see these games.</small>
      </section>
    );
  return (
    <form
      action={action}
      className="mb-[15px] grid gap-3 rounded-[15px] border border-[#e4bd78] bg-[#fffbf3] p-[14px] [&>span]:grid [&>span]:gap-[5px] [&>span>b]:text-base [&>span>b]:text-[#8a5900] [&>span>small]:text-xs [&>span>small]:leading-[1.45] [&>span>small]:text-muted [&_form]:grid [&_form]:gap-2 [&_.btn]:w-full"
    >
      <input type="hidden" name="divisionId" value={division.id} />
      <span>
        <b>Draft Schedule</b>
        <small>
          {missingCount
            ? `${missingCount} round-robin matchup${missingCount === 1 ? " is" : "s are"} still missing.`
            : "Every matchup is scheduled. Review the dates and courts before publishing."}
        </small>
      </span>
      <Feedback state={state} />
      <button className="btn primary" disabled={pending || missingCount > 0}>
        {pending
          ? "Finalizing…"
          : missingCount
            ? "Complete Matchups First"
            : "Finalize & Notify Players"}
      </button>
    </form>
  );
}

function CreateGameForm({
  division,
  playoffAvailable,
  regularGamesRemaining,
}: {
  division: OwnerDivision;
  playoffAvailable: boolean;
  regularGamesRemaining: number;
}) {
  const [state, action, pending] = useActionState(createGameAction, initialState);
  const teams = division.teams.filter((team) => team.active);
  return (
    <details className={actionCard} data-game-card="new">
      <summary className={`${actionSummary} grid-cols-[44px_1fr_auto]`}>
        <span className={ownerIcon}>
          <Plus className="ui-icon" />
        </span>
        <span className="grid gap-[4px]">
          <b className="text-[15px]">
            {playoffAvailable ? "Add Regular or Playoff Game" : "Add a Regular-Season Game"}
          </b>
          <small className="text-[13px] leading-[1.35] text-muted">
            {playoffAvailable
              ? "Round robin complete · Playoffs unlocked"
              : `${regularGamesRemaining} round-robin result${regularGamesRemaining === 1 ? "" : "s"} remaining before playoffs`}
          </small>
        </span>
        <strong aria-hidden="true" className={caret}>
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={action} className={`${ownerForm} ${gameForm}`}>
        <input type="hidden" name="divisionId" value={division.id} />
        {playoffAvailable ? (
          <label>
            Game type
            <select name="phase" defaultValue="playoff">
              <option value="playoff">Playoff game</option>
              <option value="regular">Additional regular-season game</option>
            </select>
          </label>
        ) : (
          <input type="hidden" name="phase" value="regular" />
        )}
        <label>
          Home team
          <select name="homeTeamId" defaultValue="" required>
            <option value="" disabled>
              Choose home team
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Away team
          <select name="awayTeamId" defaultValue="" required>
            <option value="" disabled>
              Choose away team
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date and time
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          Venue
          <input name="venue" defaultValue="Kada Court Center" maxLength={120} required />
        </label>
        <label>
          Court
          <input name="court" placeholder="Example: Court 2" maxLength={60} />
        </label>
        <p className="m-0 rounded-[11px] bg-[#e8f4e8] p-[11px] text-[13px] leading-[1.45] text-[#176c2c]">
          Uniforms are automatic: home wears light and away wears dark.
        </p>
        <Feedback state={state} />
        <button className="btn primary" disabled={pending || teams.length < 2}>
          {pending
            ? "Adding game…"
            : teams.length < 2
              ? "Add Two Teams First"
              : playoffAvailable
                ? "Add Game"
                : "Add Regular-Season Game"}
        </button>
      </form>
    </details>
  );
}

function GameCancellationCard({ game }: { game: OwnerSeason["games"][number] }) {
  const [state, action, pending] = useActionState(changeGameStatusAction, initialState);
  return (
    <section className={`${changePanel} ${cancelPanel}`}>
      <header>
        <b>Cancel Game</b>
        <small>Use only if this game will not be played.</small>
      </header>
      <form action={action} className={ownerForm}>
        <input type="hidden" name="gameId" value={game.id} />
        <input type="hidden" name="status" value="canceled" />
        <label>
          Reason
          <textarea
            name="reason"
            defaultValue={game.status === "canceled" ? game.statusReason : ""}
            maxLength={500}
            placeholder="Why will this game not be played?"
            required
          />
        </label>
        <Feedback state={state} />
        <button className="btn secondary" disabled={pending}>
          {pending ? "Canceling…" : "Cancel & Notify Players"}
        </button>
      </form>
    </section>
  );
}

function GameEditor({ game }: { game: OwnerSeason["games"][number] }) {
  const [state, action, pending] = useActionState(rescheduleGameAction, initialState);
  const played = game.homeScore !== null && game.awayScore !== null;
  const summary = (
    <>
      <b>
        {game.homeTeam} {played ? game.homeScore : ""}
        {played ? " – " : " vs "}
        {played ? game.awayScore : ""} {game.awayTeam}
      </b>
      <small>
        {displayDate(game.localStartsAt)} · {displayTime(game.localStartsAt)}
      </small>
    </>
  );
  if (game.finalized)
    return (
      <article
        id={`game-${game.id}`}
        className={`${actionCard} scroll-mt-[16px]`}
        data-game-card="final"
      >
        <div className="grid gap-[4px] p-[14px_16px] [&_b]:text-[15px] [&_small]:text-[12px] [&_small]:text-muted">
          {summary}
        </div>
      </article>
    );
  return (
    <details
      id={`game-${game.id}`}
      // game-postponed and game-canceled recolour the card and its summary and
      // render in no conference the screenshots can reach, so they are left in
      // globals.css unconverted. Both are unlayered and still outrank the
      // border and background utilities beside them.
      className={`${actionCard} scroll-mt-[16px] game-${game.status}`}
      data-game-card="edit"
    >
      <summary className={`${actionSummary} grid-cols-[minmax(0,1fr)_auto]`}>
        {/* The same fragment renders in the finalized card below, where
            game-editor-summary sizes it differently. These reach b and small
            from here rather than from the fragment, which cannot carry two
            sets at once. */}
        <span className="grid gap-[4px] [&>b]:text-[15px] [&>small]:text-[12px] [&>small]:leading-[1.35] [&>small]:text-muted">
          {summary}
        </span>
        <strong aria-hidden="true" className={caret}>
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <section className={`update-schedule-panel ${changePanel}`}>
        <header>
          <b>Update Schedule</b>
          <small>Change the game details and notify both teams.</small>
        </header>
        <form action={action} className={`${ownerForm} ${gameForm}`}>
          <input type="hidden" name="gameId" value={game.id} />
          <label>
            Date and time
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={game.localStartsAt}
              required
            />
          </label>
          <label>
            Venue
            <input name="venue" defaultValue={game.venue} maxLength={120} required />
          </label>
          <label>
            Court
            <input name="court" defaultValue={game.court} maxLength={60} />
          </label>
          <label>
            Message to players <small>(optional)</small>
            <textarea
              name="reason"
              maxLength={500}
              placeholder="Example: Game moved because the court is unavailable."
            />
          </label>
          <Feedback state={state} />
          <button className="btn secondary" disabled={pending}>
            {pending ? "Updating…" : "Update & Notify Players"}
          </button>
        </form>
      </section>
      <GameCancellationCard game={game} />
    </details>
  );
}

function weekStart(localStartsAt: string) {
  const [year, month, day] = localStartsAt.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function displayTime(value: string) {
  const [hour, minute] = value.slice(11, 16).split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}

function WeeklyScheduleTable({ season }: { season: OwnerSeason }) {
  const divisionNames = new Map(season.divisions.map((division) => [division.id, division.name]));
  const sorted = season.games
    .slice()
    .sort((a, b) => a.localStartsAt.localeCompare(b.localStartsAt));
  const weeks = [
    ...new Map(
      sorted.map((game) => [weekStart(game.localStartsAt), [] as typeof sorted]),
    ).entries(),
  ];
  for (const game of sorted)
    weeks.find(([key]) => key === weekStart(game.localStartsAt))?.[1].push(game);
  if (!sorted.length) return null;
  return (
    <section className={weeklySchedule}>
      <header>
        <div>
          <small>WEEKLY VIEW</small>
          <h3>All Teams</h3>
          <p>{sorted.length} total scheduled games</p>
        </div>
      </header>
      <div className={weeklyScheduleList}>
        {weeks.map(([key, games], weekIndex) => {
          const end = new Date(`${key}T12:00:00Z`);
          end.setUTCDate(end.getUTCDate() + 6);
          return (
            <details className={scheduleWeek} key={key} open={weekIndex === 0}>
              <summary>
                <span>
                  {displayDate(key)} – {displayDate(end.toISOString().slice(0, 10))}
                </span>
                <small>
                  {games.length} game{games.length === 1 ? "" : "s"}
                </small>
                <strong aria-hidden="true">
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div className={scheduleTableScroll}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Court</th>
                      <th>Division</th>
                      <th>Type</th>
                      <th>Matchup</th>
                      <th>Result</th>
                      <th>Status</th>
                      <th>Scoresheet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => {
                      const played = game.homeScore !== null && game.awayScore !== null;
                      return (
                        <tr key={game.id}>
                          <td>{displayDate(game.localStartsAt)}</td>
                          <td>{displayTime(game.localStartsAt)}</td>
                          <td>{game.court || "—"}</td>
                          <td>{divisionNames.get(game.divisionId) ?? "—"}</td>
                          <td>
                            <em className={`${gamePhase} ${gamePhaseTone(game.phase)}`}>
                              {game.phase === "playoff" ? "Playoff" : "Regular"}
                            </em>
                          </td>
                          <td>
                            <b>{game.homeTeam}</b>
                            <span>vs {game.awayTeam}</span>
                          </td>
                          <td>
                            {played ? (
                              <b>
                                {game.homeScore}–{game.awayScore}
                              </b>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <em className={`${scheduleStatus} ${scheduleStatusTone(game.status)}`}>
                              {game.status}
                            </em>
                          </td>
                          <td>
                            <a
                              className="min-h-[34px] cursor-pointer rounded-[9px] border border-[#d5a54f] bg-[#fffaf2] p-[6px_9px] text-[11px] font-[850] whitespace-nowrap text-[#7b5207]"
                              href={`/owner/scores#score-${game.id}`}
                            >
                              {played ? "Edit result" : "Add score"}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function ScheduleMethodPicker({
  season,
  division,
}: {
  season: OwnerSeason;
  division: OwnerDivision;
}) {
  const [method, setMethod] = useState<"manual" | "automate" | null>(null);
  const choose = (next: "manual" | "automate") =>
    setMethod((current) => (current === next ? null : next));
  return (
    <section className="grid gap-[9px] [&>p]:m-[0_2px_5px] [&>p]:text-[13px] [&>p]:text-muted">
      <div className="my-[15px] grid grid-cols-2 gap-[9px]">
        <button
          type="button"
          style={{
            minHeight: 96,
            padding: 12,
            textAlign: "left",
            borderColor: method === "manual" ? "#d18408" : undefined,
            background: method === "manual" ? "#fffbf3" : undefined,
          }}
          className={scheduleChoiceCard}
          onClick={() => choose("manual")}
          aria-expanded={method === "manual"}
        >
          <span>
            <Pencil className="ui-icon" />
          </span>
          <b>Manual</b>
          <small>Create each game day.</small>
        </button>
        <button
          type="button"
          style={{
            minHeight: 96,
            padding: 12,
            textAlign: "left",
            borderColor: method === "automate" ? "#d18408" : undefined,
            background: method === "automate" ? "#fffbf3" : undefined,
          }}
          className={`${scheduleChoiceCard} border-[#e4bd78]! bg-[#fffbf3]!`}
          onClick={() => choose("automate")}
          aria-expanded={method === "automate"}
        >
          <span>
            <Sparkles className="ui-icon" />
          </span>
          <b>Automate</b>
          <small>Let KCH build a draft.</small>
        </button>
      </div>
      {method === "manual" && (
        <div className="schedule-method-expanded">
          <ManualGameDayBuilder season={season} division={division} />
        </div>
      )}
      {method === "automate" && (
        <div className="schedule-method-expanded">
          <KchDivisionScheduleBuilder season={season} division={division} />
        </div>
      )}
    </section>
  );
}

function DivisionScheduleOperation({
  season,
  division,
}: {
  season: OwnerSeason;
  division: OwnerDivision;
}) {
  const divisionGames = season.games.filter((game) => game.divisionId === division.id);
  const regularGames = divisionGames.filter((game) => game.phase === "regular");
  const regularGamesRemaining = regularGames.filter(
    (game) => game.homeScore === null || game.awayScore === null,
  ).length;
  const playoffAvailable = regularGames.length > 0 && regularGamesRemaining === 0;
  const teams = division.teams.filter((team) => team.active);
  const scheduled = new Set(
    regularGames
      .filter((game) => game.status !== "canceled")
      .map((game) => [game.homeTeamId, game.awayTeamId].sort().join(":")),
  );
  let missingCount = 0;
  for (let first = 0; first < teams.length; first++)
    for (let second = first + 1; second < teams.length; second++)
      if (!scheduled.has([teams[first].id, teams[second].id].sort().join(":"))) missingCount++;
  const status = !division.rosterFinalPublished
    ? "Waiting for final roster"
    : division.scheduleStatus === "final"
      ? "Final"
      : division.scheduleStatus === "draft"
        ? "Draft"
        : "Not started";
  return (
    <details
      id={`division-${division.id}`}
      // division-operation keeps its class with no rule of its own: a
      // .schedule-finality override still reaches through it, and
      // division-schedule-final is a sibling class with rules of its own.
      className={`division-operation group overflow-hidden rounded-[15px] border border-line bg-[#fbfaf8] division-schedule-${division.scheduleStatus}`}
      open={division.rosterFinalPublished && division.scheduleStatus !== "final"}
    >
      <summary className="grid min-h-[76px] cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-[10px] p-[13px_15px] [&::-webkit-details-marker]:hidden">
        <span className="grid gap-[3px]">
          <b className="text-[16px]">{division.name}</b>
          <small className="text-[12px] text-muted">
            {division.teams.length} teams · {divisionGames.length} games
          </small>
        </span>
        <em
          className={`inline-flex w-max self-center rounded-full p-[5px_8px] text-[9px] font-[900] tracking-[0.04em] not-italic ${
            division.scheduleStatus === "final"
              ? "bg-[#eaf6ec] text-green"
              : "bg-[#fff4da] text-[#8a5900]"
          }`}
        >
          {status}
        </em>
        <strong
          aria-hidden="true"
          className="text-[22px] transition-transform group-open:rotate-90"
        >
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="border-t border-line p-[11px]">
        {!division.rosterFinalPublished ? (
          <p className={emptyNote}>
            Publish the final {division.name} roster before creating its schedule.
          </p>
        ) : (
          <>
            {!regularGames.length && <ScheduleMethodPicker season={season} division={division} />}
            {regularGames.length > 0 && (
              <>
                <DivisionMatchupProgress division={division} games={divisionGames} />
                <FinalizeDivisionSchedule division={division} missingCount={missingCount} />
                {division.scheduleStatus !== "final" && division.scheduleMode !== "kch" && (
                  <details className={`my-[10px] ${scheduleMethodCard}`}>
                    <summary>
                      <span>
                        <Plus className="ui-icon" />
                      </span>
                      <span>
                        <b>Add Another Game Day</b>
                        <small>Save the next day&apos;s games as one group.</small>
                      </span>
                      <strong aria-hidden="true">
                        <ChevronRight className="go-caret" />
                      </strong>
                    </summary>
                    <ManualGameDayBuilder season={season} division={division} />
                  </details>
                )}
                {division.scheduleStatus === "final" && (
                  <CreateGameForm
                    division={division}
                    playoffAvailable={playoffAvailable}
                    regularGamesRemaining={regularGamesRemaining}
                  />
                )}
                <section className="[&>h3]:m-[18px_3px_10px] [&>h3]:text-[15px] [&>h3]:text-gold">
                  <h3>Update Individual Games</h3>
                  {divisionGames.map((game) => (
                    <GameEditor game={game} key={game.id} />
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </details>
  );
}

function ScheduleSeasonOperations({ season, index }: { season: OwnerSeason; index: number }) {
  const finalized = season.divisions.filter(
    (division) => division.scheduleStatus === "final",
  ).length;
  return (
    <details className="card group overflow-hidden" open={index === 0}>
      <summary className={seasonSummary}>
        <span className="grid gap-[5px]">
          <b className="text-[18px]">{season.name}</b>
          <small className="text-[13px] text-muted">
            {season.games.length} total games · {finalized} of {season.divisions.length} division
            schedules final
          </small>
        </span>
        <strong aria-hidden="true" className={caret}>
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className={seasonPanel}>
        <div className="grid gap-[9px]">
          {season.divisions.map((division) => (
            <DivisionScheduleOperation season={season} division={division} key={division.id} />
          ))}
        </div>
      </div>
    </details>
  );
}

export function OwnerGameManagement({ seasons }: { seasons: OwnerSeason[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const scheduleSeasons = seasons.filter(
    (season) => !season.canceledAt && season.divisions.some((division) => division.teams.length),
  );
  const current = scheduleSeasons.filter((season) => season.endsOn >= today);
  const completed = scheduleSeasons.filter((season) => season.endsOn < today);
  if (!scheduleSeasons.length)
    return (
      <section className={`card ${emptyOperation}`}>
        <span>
          <CalendarDays className="ui-icon" />
        </span>
        <div>
          <h3>No schedule workspace yet</h3>
          <p>Complete the roster draft in Season Setup to begin Step 8.</p>
        </div>
      </section>
    );
  return (
    <section className={`${ownerOperations} ${pageSection}`}>
      <p className={operationsIntro}>
        Choose a season, then a division. Each division keeps its own schedule, teams, and results.
      </p>
      {current.length ? (
        <div className="grid gap-[10px]">
          {current.map((season, index) => (
            <ScheduleSeasonOperations season={season} index={index} key={season.id} />
          ))}
        </div>
      ) : (
        <p className={emptyNote}>No current schedules. Completed seasons are available below.</p>
      )}
      {completed.length ? (
        <details className="group mt-[18px] [&>summary]:flex [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:justify-between [&>summary]:gap-3 [&>summary]:border-t [&>summary]:border-line [&>summary]:py-4 [&>summary::-webkit-details-marker]:hidden [&>summary_span]:grid [&>summary_span]:gap-[3px] [&>summary_small]:text-xs [&>summary_small]:text-muted [&>summary_strong]:text-[22px] group-open:[&>summary_strong]:rotate-90">
          <summary>
            <span>
              <b>Season Archive</b>
              <small>
                {completed.length} completed season{completed.length === 1 ? "" : "s"}
              </small>
            </span>
            <strong aria-hidden="true">
              <ChevronRight className="go-caret" />
            </strong>
          </summary>
          {completed.map((season) => (
            // mb-[10px] is carried across by hand from an owner-refinement
            // rule: the archive renders only for a season that has ended, and
            // there is none in any conference a screenshot can reach.
            <details className="card group mb-[10px] overflow-hidden" key={season.id}>
              <summary className={seasonSummary}>
                <span className="grid gap-[5px]">
                  <b className="text-[18px]">{season.name}</b>
                  <small className="text-[13px] text-muted">
                    {season.games.length} game{season.games.length === 1 ? "" : "s"} · completed
                  </small>
                </span>
                <strong aria-hidden="true" className={caret}>
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div className={seasonPanel}>
                <WeeklyScheduleTable season={season} />
                <p className={emptyNote}>Completed schedules are kept here as a record.</p>
              </div>
            </details>
          ))}
        </details>
      ) : null}
    </section>
  );
}

/* A payment or waiver awaiting the owner's decision. Renders only while one is
   pending, which no conference in the suite has. */
const reviewCard =
  "overflow-hidden rounded-2xl border border-line bg-white [&>summary]:grid [&>summary]:min-h-[72px] [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[44px_1fr_auto] [&>summary]:items-center [&>summary]:gap-[11px] [&>summary]:p-[13px] [&>summary::-webkit-details-marker]:hidden [&>summary>span:nth-child(2)]:grid [&>summary>span:nth-child(2)]:gap-1 [&>summary_b]:text-[15px] [&>summary_small]:text-[13px] [&>summary_small]:text-muted [&>summary>strong]:text-2xl [&>form]:border-t [&>form]:border-line [&>form]:p-[15px]";
const reviewIcon =
  "grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#eef3f8] text-[21px] font-[900] text-blue";
const reviewFact =
  "grid gap-[5px] rounded-[11px] bg-[#f7f5f2] p-[10px] [&_small]:text-[11px] [&_small]:text-gold [&_b]:text-[13px] [&_b]:leading-[1.4]";

function PaymentReviewCard({ submission }: { submission: OwnerPaymentSubmission }) {
  const [state, action, pending] = useActionState(reviewPaymentNoticeAction, initialState);
  const isWaiver = submission.method === "waiver";
  return (
    <details className={`${reviewCard} ${isWaiver ? "border-[#e8c98f]" : ""}`}>
      <summary>
        <span className={`${reviewIcon} ${isWaiver ? "bg-[#fff4da]! text-[#8a5900]!" : ""}`}>
          {isWaiver ? (
            <FileCheck className="ui-icon" />
          ) : submission.method === "zelle" ? (
            <Landmark className="ui-icon" />
          ) : (
            <Wallet className="ui-icon" />
          )}
        </span>
        <span>
          <b>{submission.playerName}</b>
          <small>
            {isWaiver ? "Waiver request" : "Payment notice"} · {submission.feeLabel} · $
            {submission.amount.toFixed(2)}
          </small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={action} className={ownerForm}>
        <input type="hidden" name="submissionId" value={submission.id} />
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-[7px] max-tiny:grid-cols-2 [&>span:first-child]:max-tiny:col-span-full [&>span]:grid [&>span]:gap-[5px] [&>span]:rounded-[11px] [&>span]:bg-[#f7f5f2] [&>span]:p-[10px] [&>span]:[&_small]:text-[11px] [&>span]:[&_small]:text-gold [&>span]:[&_b]:text-[13px] [&>span]:[&_b]:leading-[1.4]">
          <span>
            <small>SEASON / TEAM</small>
            <b>
              {submission.seasonName}
              <br />
              {submission.teamName}
            </b>
          </span>
          <span>
            <small>REQUEST</small>
            <b>{submission.method.toUpperCase()}</b>
          </span>
          <span>
            <small>SUBMITTED</small>
            <b>{submission.createdLabel}</b>
          </span>
        </div>
        <p className={`m-0 ${reviewFact}`}>
          <small>{isWaiver ? "PLAYER COMMENT" : "PLAYER REFERENCE"}</small>
          <b>{submission.reference || "No reference provided"}</b>
        </p>
        <label>
          Owner note <small>(required when declining)</small>
          <textarea
            name="reviewNote"
            maxLength={500}
            placeholder={
              isWaiver
                ? "Optional approval note or reason for declining"
                : "Optional confirmation note or reason for declining"
            }
          />
        </label>
        <Feedback state={state} />
        <div className="grid grid-cols-2 gap-[9px] max-tiny:grid-cols-1">
          <button
            className="btn bg-green! text-white!"
            name="decision"
            value="confirmed"
            disabled={pending}
          >
            {isWaiver ? "Approve Waiver" : "Confirm Received"}
          </button>
          <button
            className="btn border! border-[#e5b3b5]! bg-white! text-[#a51118]!"
            name="decision"
            value="declined"
            disabled={pending}
          >
            Decline
          </button>
        </div>
      </form>
    </details>
  );
}

/* The owner's payment tracking, drawn twice: once for the live season and once
   in the past-payments archive. The two were identical markup pointing at one
   block of globals.css, so they point at one block of strings instead. */
/* Every descendant here shouts. .owner-form sits on the same elements and sets
   the label size and the control metrics unlayered; .game-form only ever beat
   it on source order, which a layered utility cannot do. */
const gameForm =
  "border-t border-line p-[16px] [&_label]:text-[14px]! [&_input]:min-h-[48px]! [&_input]:text-[16px]! [&_select]:min-h-[48px]! [&_select]:text-[16px]!";
/* The update panel and the cancel panel: same box, different alarm. The form
   gap shouts because .owner-form is on the same element with 12px unlayered,
   and .game-change-panel form only ever won it on specificity. */
const changePanel =
  "m-[12px] overflow-hidden rounded-[14px] border border-line bg-white [&>header]:grid [&>header]:gap-[3px] [&>header]:border-b [&>header]:border-line [&>header]:bg-[#fcfbf9] [&>header]:p-[12px_13px] [&>header_b]:text-[15px] [&>header_b]:text-navy [&>header_small]:text-[12px] [&>header_small]:text-muted [&_form]:grid [&_form]:gap-[11px]! [&_form]:p-[13px] [&_.btn]:w-full";
const cancelPanel =
  "border-[#edc5c7]! bg-[#fffafa]! [&>header]:border-b-[#edc5c7] [&>header]:bg-[#fff4f4] [&>header_b]:text-[#a51d25] [&_.btn]:bg-[#a51d25]! [&_.btn]:text-white!";
const paymentSeason = "card group overflow-hidden";
/* The two photo pickers - one in preseason setup, one on the uniforms page.
   The preseason one adds a 2px top margin and nothing else. */
const uniformUploadGrid =
  "grid grid-cols-2 gap-[9px] [&_label]:overflow-hidden [&_label]:rounded-[13px] [&_label]:border [&_label]:border-line [&_label]:bg-white [&_label]:p-[9px] [&_label>span]:mb-[7px] [&_label>span]:block [&_label>span]:text-gold [&_i]:not-italic [&_img,&_i]:grid [&_img,&_i]:h-[130px] [&_img,&_i]:w-full [&_img,&_i]:place-items-center [&_img,&_i]:rounded-[10px] [&_img,&_i]:bg-[#f1efec] [&_img,&_i]:object-cover [&_img,&_i]:text-[35px] [&_input]:mt-[8px] [&_input]:w-full [&_input]:min-h-auto! [&_input]:text-[12px]!";
const paymentSummary =
  "grid min-h-[76px] cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_24px] items-center gap-[10px] p-[14px_15px] [&::-webkit-details-marker]:hidden [&>span:first-child]:grid [&>span:first-child]:min-w-0 [&>span:first-child]:gap-[5px] [&>span:first-child_b]:leading-[1.3] [&_b]:text-[17px] [&_small]:text-[11px] [&_small]:leading-[1.35] [&_small]:text-muted";
const paymentCaret = "text-[24px] transition-transform group-open:rotate-90";
const paymentBody = "border-t border-line p-[12px]";
/* The four stat tiles, and the three colours the division card gives them. */
const paymentStats =
  "mb-0 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[7px] [&>span]:grid [&>span]:min-h-[61px] [&>span]:content-center [&>span]:gap-[4px] [&>span]:rounded-[11px] [&>span]:bg-[#f6f4f1] [&>span]:p-[9px] [&>span:nth-child(2)]:bg-[#eaf6ec] [&>span:nth-child(3)]:bg-[#fff7e8] [&>span:nth-child(4)]:bg-[#f1f3f5] [&_b]:text-[14px] [&_small]:text-[9px] [&_small]:font-[850] [&_small]:tracking-[0.04em] [&_small]:text-muted min-[700px]:grid-cols-[repeat(4,minmax(0,1fr))]";
/* Three tiles: paid, not paid, waived. The first two recolour themselves, and
   have to shout to do it - the tile's own border and background are utilities
   on the same element, at the same specificity, so source order in the
   generated sheet would otherwise decide. */
const paymentCounts =
  "mb-[11px] grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[7px] [&>span]:grid [&>span]:min-h-[68px] [&>span]:content-center [&>span]:gap-[5px] [&>span]:rounded-[12px] [&>span]:border [&>span]:border-line [&>span]:bg-white [&>span]:p-[9px_6px] [&>span]:text-center [&_b]:text-[20px] [&_small]:text-[9px] [&_small]:leading-[1.25] [&_small]:font-[850] [&_small]:tracking-[0.05em] [&_small]:text-muted";
const paymentPlayerList =
  "grid gap-[8px] border-t border-line p-[9px] min-[700px]:grid-cols-[repeat(2,minmax(0,1fr))]";
const paymentDetails =
  "group/details mt-[14px] overflow-hidden rounded-[13px] border border-line bg-[#fbfaf8]";
const paymentDetailsSummary =
  "grid min-h-[62px] cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-[10px] p-[11px_13px] [&::-webkit-details-marker]:hidden [&>span]:grid [&>span]:gap-[4px] [&_b]:text-[14px] [&_small]:text-[10px] [&_small]:text-muted";
/* Named, because this disclosure sits inside the season one and a bare
   group-open: would turn its caret when the season opened. */
const paymentDetailsCaret = "text-[22px] transition-transform group-open/details:rotate-90";
const paymentRow =
  "rounded-[13px] border border-line bg-white p-[12px] [&>header]:flex [&>header]:items-start [&>header]:justify-between [&>header]:gap-[9px] [&>header>span]:grid [&>header>span]:min-w-0 [&>header>span]:gap-[4px] [&>header_b]:text-[15px] [&>header_small]:text-[11px] [&>header_small]:text-muted [&>p]:m-[9px_0_0] [&>p]:flex [&>p]:items-center [&>p]:justify-between [&>p]:gap-[8px] [&>p]:border-t [&>p]:border-line [&>p]:pt-[9px] [&>p_b]:text-[12px] [&>p_small]:text-[9px] [&>p_small]:font-[850] [&>p_small]:tracking-[0.04em] [&>p_small]:text-muted";
const paymentAmounts =
  "mt-[11px] grid grid-cols-3 gap-[6px] [&>span]:grid [&>span]:gap-[4px] [&>span]:rounded-[9px] [&>span]:bg-[#f7f5f2] [&>span]:p-[8px_6px] [&_b]:text-[12px] [&_small]:text-[9px] [&_small]:font-[850] [&_small]:tracking-[0.04em] [&_small]:text-muted";
/* status-waived and status-review render in no conference the suite can see;
   their colours are carried across with the two that do. */
const paymentStatus = "flex-none rounded-full p-[5px_8px] text-[10px] font-[850] not-italic";
const paymentStatusTone = (status: string, pendingReview: boolean) =>
  pendingReview || status === "Mixed" || status === "Waived"
    ? "bg-[#fff4da] text-[#8a5900]"
    : status === "Due"
      ? "bg-[#fff1f1] text-[#a51118]"
      : "bg-[#eaf6ec] text-green";

export function OwnerPaymentManagement({
  submissions,
  groups,
}: {
  submissions: OwnerPaymentSubmission[];
  groups: OwnerPaymentGroup[];
}) {
  const pending = submissions.filter((submission) => submission.status === "pending");
  return (
    <section className={`payment-operations ${ownerOperations} ${pageSection}`}>
      {pending.length > 0 && (
        <section className="mt-[27px]">
          <p className="eyebrow">NEEDS ATTENTION</p>
          <h2>Payment Confirmations</h2>
          <p className={operationsIntro}>
            Only confirmed Zelle or cash notices change the player&apos;s balance.
          </p>
          <div className="grid gap-[9px]">
            {pending.map((submission) => (
              <PaymentReviewCard submission={submission} key={submission.id} />
            ))}
          </div>
        </section>
      )}
      <section className="mt-[27px]">
        <h2>Season Tracking</h2>
        <p className={operationsIntro}>
          Each card contains one season and division. Open it for player-level details.
        </p>
        {groups.length ? (
          <div className="grid gap-[11px]">
            {groups.map((group) => (
              <details className={paymentSeason} key={group.divisionId}>
                <summary className={paymentSummary}>
                  <span>
                    <b>
                      {group.seasonName} · {group.divisionName}
                    </b>
                    <small>
                      {group.totalPlayers} rostered players · {money(group.perPlayerTotal)} per
                      player
                    </small>
                  </span>
                  <span className="grid gap-[3px] text-right [&>b]:text-[15px]! [&>b]:text-[#a51118]">
                    <small>NOT PAID</small>
                    <b>{group.unpaidPlayers}</b>
                  </span>
                  <strong aria-hidden="true" className={paymentCaret}>
                    <ChevronRight className="go-caret" />
                  </strong>
                </summary>
                <div className={paymentBody}>
                  <p className={cardLabel}>PLAYER PAYMENT STATUS</p>
                  <div className={paymentCounts}>
                    <span className="border-[#cce6d0]! bg-[#eaf6ec]! [&>b]:text-green">
                      <small>PAID</small>
                      <b>{group.paidPlayers}</b>
                    </span>
                    <span className="border-[#efc9cb]! bg-[#fff1f1]! [&>b]:text-[#a51118]">
                      <small>NOT PAID</small>
                      <b>{group.unpaidPlayers}</b>
                    </span>
                    <span>
                      <small>WAIVED</small>
                      <b>{group.waivedPlayers}</b>
                    </span>
                  </div>
                  <p className={cardLabel}>PAID PLAYERS BY METHOD</p>
                  <div className="grid grid-cols-2 gap-[7px] [&>span]:grid [&>span]:min-h-[78px] [&>span]:content-center [&>span]:gap-[4px] [&>span]:rounded-[12px] [&>span]:border [&>span]:border-line [&>span]:bg-white [&>span]:p-[10px] [&_b]:text-[15px] [&_small]:text-[9px] [&_small]:font-[850] [&_small]:tracking-[0.05em] [&_small]:text-muted [&_strong]:text-[12px] [&_strong]:text-green">
                    <span>
                      <small>ZELLE</small>
                      <b>{group.zellePlayers} players</b>
                      <strong>{money(group.zelleReceived)}</strong>
                    </span>
                    <span>
                      <small>CASH</small>
                      <b>{group.cashPlayers} players</b>
                      <strong>{money(group.cashReceived)}</strong>
                    </span>
                  </div>
                  <p className={cardLabel}>SEASON / DIVISION INCOME</p>
                  <div className={paymentStats}>
                    <span>
                      <small>EXPECTED INCOME</small>
                      <b>{money(group.assessed)}</b>
                    </span>
                    <span>
                      <small>INCOME RECEIVED</small>
                      <b>{money(group.received)}</b>
                    </span>
                    <span>
                      <small>OUTSTANDING</small>
                      <b>{money(group.due)}</b>
                    </span>
                    <span>
                      <small>WAIVED</small>
                      <b>{money(group.waived)}</b>
                    </span>
                  </div>
                  <details className={paymentDetails}>
                    <summary className={paymentDetailsSummary}>
                      <span>
                        <b>Player Payment Details</b>
                        <small>Paid, not paid, waived, and payment method</small>
                      </span>
                      <strong aria-hidden="true" className={paymentDetailsCaret}>
                        <ChevronRight className="go-caret" />
                      </strong>
                    </summary>
                    <div className={paymentPlayerList}>
                      {group.players.map((player) => (
                        <article className={paymentRow} key={player.registrationId}>
                          <header>
                            <span>
                              <b>{player.playerName}</b>
                              <small>{player.teamName}</small>
                            </span>
                            <em
                              className={`${paymentStatus} ${paymentStatusTone(player.status, player.pendingReview)}`}
                            >
                              {player.pendingReview ? "Pending review" : player.status}
                            </em>
                          </header>
                          <div className={paymentAmounts}>
                            <span>
                              <small>RECEIVED</small>
                              <b>{money(player.received)}</b>
                            </span>
                            <span>
                              <small>DUE</small>
                              <b>{money(player.due)}</b>
                            </span>
                            <span>
                              <small>WAIVED</small>
                              <b>{money(player.waived)}</b>
                            </span>
                          </div>
                          <p>
                            <small>PAYMENT METHOD</small>
                            <b>
                              {player.methods.length
                                ? player.methods
                                    .map(
                                      (method) => method.charAt(0).toUpperCase() + method.slice(1),
                                    )
                                    .join(" + ")
                                : "—"}
                            </b>
                          </p>
                        </article>
                      ))}
                    </div>
                  </details>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <section className={`card ${emptyOperation}`}>
            <span>₱</span>
            <div>
              <h3>No player charges yet</h3>
              <p>
                Season and division payment tracking will appear after a roster draft is published.
              </p>
            </div>
          </section>
        )}
      </section>
    </section>
  );
}

export function OwnerPastPaymentsArchive({ groups }: { groups: OwnerPaymentGroup[] }) {
  return (
    <section className={`payment-operations ${ownerOperations} ${pageSection}`}>
      <h2>Completed Seasons</h2>
      <p className={operationsIntro}>Previous-season payment records stay here for reference.</p>
      {groups.length ? (
        <div className="grid gap-[11px]">
          {groups.map((group) => (
            <details className={paymentSeason} key={group.divisionId}>
              <summary className={paymentSummary}>
                <span>
                  <b>
                    {group.seasonName} · {group.divisionName}
                  </b>
                  <small>
                    {group.totalPlayers} rostered players · {money(group.received)} received
                  </small>
                </span>
                <strong aria-hidden="true" className={paymentCaret}>
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div className={paymentBody}>
                <div className={paymentStats}>
                  <span>
                    <small>EXPECTED</small>
                    <b>{money(group.assessed)}</b>
                  </span>
                  <span>
                    <small>RECEIVED</small>
                    <b>{money(group.received)}</b>
                  </span>
                  <span>
                    <small>OUTSTANDING</small>
                    <b>{money(group.due)}</b>
                  </span>
                </div>
                <details className={paymentDetails}>
                  <summary className={paymentDetailsSummary}>
                    <span>
                      <b>Player Payment Details</b>
                      <small>Read-only payment history</small>
                    </span>
                    <strong aria-hidden="true" className={paymentDetailsCaret}>
                      <ChevronRight className="go-caret" />
                    </strong>
                  </summary>
                  <div className={paymentPlayerList}>
                    {group.players.map((player) => (
                      <article className={paymentRow} key={player.registrationId}>
                        <header>
                          <span>
                            <b>{player.playerName}</b>
                            <small>{player.teamName}</small>
                          </span>
                          <em
                            className={`${paymentStatus} ${paymentStatusTone(player.status, player.pendingReview)}`}
                          >
                            {player.pendingReview ? "Pending review" : player.status}
                          </em>
                        </header>
                        <div className={paymentAmounts}>
                          <span>
                            <small>RECEIVED</small>
                            <b>{money(player.received)}</b>
                          </span>
                          <span>
                            <small>DUE</small>
                            <b>{money(player.due)}</b>
                          </span>
                          <span>
                            <small>WAIVED</small>
                            <b>{money(player.waived)}</b>
                          </span>
                        </div>
                        <p>
                          <small>PAYMENT METHOD</small>
                          <b>
                            {player.methods.length
                              ? player.methods
                                  .map((method) => method.charAt(0).toUpperCase() + method.slice(1))
                                  .join(" + ")
                              : "—"}
                          </b>
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className={emptyNote}>No completed-season payments yet.</p>
      )}
    </section>
  );
}

function DivisionUniformForm({
  seasonName,
  division,
}: {
  seasonName: string;
  division: OwnerDivision;
}) {
  const [photoState, photoAction, photoPending] = useActionState(
    updateDivisionUniformImagesAction,
    initialState,
  );
  return (
    <details className="overflow-hidden rounded-[15px] border border-line bg-white">
      <summary className="grid min-h-[70px] cursor-pointer list-none grid-cols-[42px_1fr_auto] items-center gap-[11px] p-[13px] [&::-webkit-details-marker]:hidden">
        <span className="grid h-[36px] w-[36px] place-items-center rounded-[11px] bg-navy font-[900] text-[#f5a313]">
          {division.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="grid gap-[4px]">
          <b className="text-[15px]">{division.name}</b>
          <small className="text-[13px] text-muted">
            {seasonName} · {division.teams.length} teams · Dark &amp; Light photos
          </small>
        </span>
        <strong aria-hidden="true" className="text-[24px]">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="[&>form]:border-t [&>form]:border-line [&>form]:p-[15px] [&>form_input]:min-h-[48px] [&>form_input]:text-[16px]">
        <form action={photoAction} className={`${ownerForm} bg-[#fbfaf8]`}>
          <input type="hidden" name="divisionId" value={division.id} />
          <div className={uniformUploadGrid}>
            <label>
              <span>Dark</span>
              {division.darkImage ? (
                <img src={division.darkImage} alt={`${division.name} dark uniform`} />
              ) : (
                <i>
                  <Camera className="ui-icon" />
                </i>
              )}
              <input name="darkImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label>
              <span>Light</span>
              {division.lightImage ? (
                <img src={division.lightImage} alt={`${division.name} light uniform`} />
              ) : (
                <i>
                  <Camera className="ui-icon" />
                </i>
              )}
              <input name="lightImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
          </div>
          <p className={fieldHelp}>
            These two photos apply to every team in the division. On a phone, choose the camera or
            photo library.
          </p>
          <Feedback state={photoState} />
          <button className="btn primary" disabled={photoPending}>
            {photoPending ? "Uploading…" : "Save Uniform Photos"}
          </button>
        </form>
      </div>
    </details>
  );
}

export function OwnerUniformManagement({ seasons }: { seasons: OwnerSeason[] }) {
  const available = seasons.filter((season) => !season.canceledAt && season.divisions.length);
  if (!available.length) return null;
  return (
    <section className={`uniform-operations ${ownerOperations} ${pageSection}`}>
      <p className="eyebrow">DIVISION DETAILS</p>
      <h2>Uniform Photos</h2>
      <p className={operationsIntro}>
        Open one season, then one division. Upload one dark and one light reference photo for every
        team in that division.
      </p>
      <div className="grid gap-[11px]">
        {available.map((season, index) => (
          <details
            className="card group mb-[12px] overflow-hidden"
            key={season.id}
            open={index === 0}
          >
            <summary className={seasonSummary}>
              <span className="grid gap-[5px]">
                <b className="text-[18px]">{season.name}</b>
                <small className="text-[13px] text-muted">
                  {season.divisions.length} division{season.divisions.length === 1 ? "" : "s"}
                </small>
              </span>
              <strong aria-hidden="true" className={caret}>
                <ChevronRight className="go-caret" />
              </strong>
            </summary>
            <div className={`grid gap-[10px] ${seasonPanel}`}>
              {season.divisions.map((division) => (
                <DivisionUniformForm
                  key={division.id}
                  seasonName={season.name}
                  division={division}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* Captain and co-captain, and the picker that swaps them. */
const leadershipRole =
  "flex items-center justify-between gap-[10px] [&>div:first-child]:grid [&>div:first-child]:min-w-0 [&>div:first-child]:gap-[2px] [&_small]:text-[10px] [&_small]:font-[800] [&_small]:text-gold [&_b]:text-[13px]";
const leadershipButtons = "[&_.btn]:p-[7px_10px]! [&_.btn]:text-xs!";

function TeamLeadershipControl({
  team,
  role,
  currentId,
  currentName,
  otherId,
  activePlayers,
}: {
  team: OwnerTeam;
  role: "Captain" | "Co-captain";
  currentId: string;
  currentName: string;
  otherId: string;
  activePlayers: OwnerRosterPlayer[];
}) {
  const [state, action, pending] = useActionState(updateLeadershipAction, initialState);
  const [editing, setEditing] = useState(false);
  const wasSaving = useRef(false);
  useEffect(() => {
    if (pending) {
      wasSaving.current = true;
      return;
    }
    if (wasSaving.current) {
      wasSaving.current = false;
      if (!state.error) setEditing(false);
    }
  }, [pending, state.error]);
  const field = role === "Captain" ? "captainId" : "coCaptainId";
  const otherField = role === "Captain" ? "coCaptainId" : "captainId";
  const eligible = activePlayers.filter((player) => player.registrationId !== otherId);
  if (editing)
    return (
      <article className="block">
        <form
          action={action}
          className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[7px] max-[430px]:grid-cols-[auto_1fr] [&>div]:flex [&>div]:gap-[6px] [&>div]:max-[430px]:col-start-2 [&_small]:whitespace-nowrap [&_select]:min-w-0 [&_select]:rounded-[9px] [&_select]:border [&_select]:border-line [&_select]:bg-white [&_select]:p-2 [&_select]:font-[inherit] [&_select]:text-xs [&_.form-error]:col-span-full [&_.form-error]:p-[7px] [&_.form-error]:text-[11px] [&_.form-success]:col-span-full [&_.form-success]:p-[7px] [&_.form-success]:text-[11px] ${leadershipButtons}`}
        >
          <small>{role.toUpperCase()}</small>
          <input type="hidden" name="teamId" value={team.id} />
          <input type="hidden" name={otherField} value={otherId} />
          <select name={field} defaultValue={currentId}>
            <option value="">Unassigned</option>
            {eligible.map((player) => (
              <option key={player.registrationId} value={player.registrationId}>
                #{player.jerseyNumber ?? "—"} {player.name}
              </option>
            ))}
          </select>
          <div>
            <button className="btn secondary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
          <Feedback state={state} />
        </form>
      </article>
    );
  return (
    <article className={leadershipRole}>
      <div>
        <small>{role.toUpperCase()}</small>
        <b>{currentName}</b>
      </div>
      <div className={`flex gap-[6px] [&_form]:flex [&_form]:gap-[6px] ${leadershipButtons}`}>
        <button className="btn secondary" type="button" onClick={() => setEditing(true)}>
          Change
        </button>
        {currentId && (
          <form action={action}>
            <input type="hidden" name="teamId" value={team.id} />
            <input type="hidden" name={field} value="" />
            <input type="hidden" name={otherField} value={otherId} />
            <button className="btn secondary" disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

function TeamLeadershipEditor({ team }: { team: OwnerTeam }) {
  const activePlayers = team.players.filter((player) => player.status === "active");
  const captain = activePlayers.find((player) => player.role === "Captain");
  const coCaptain = activePlayers.find((player) => player.role === "Co-captain");
  return (
    <section className="mb-1 grid gap-[9px] border-b border-line p-[2px_0_12px] [&>h4]:m-0 [&>h4]:text-[13px]">
      <h4>Team Leadership</h4>
      <div className="grid gap-2">
        <TeamLeadershipControl
          team={team}
          role="Captain"
          currentId={captain?.registrationId ?? ""}
          currentName={captain?.name ?? "Unassigned"}
          otherId={coCaptain?.registrationId ?? ""}
          activePlayers={activePlayers}
        />
        <TeamLeadershipControl
          team={team}
          role="Co-captain"
          currentId={coCaptain?.registrationId ?? ""}
          currentName={coCaptain?.name ?? "Unassigned"}
          otherId={captain?.registrationId ?? ""}
          activePlayers={activePlayers}
        />
      </div>
    </section>
  );
}

function TeamEditor({ team }: { team: OwnerTeam }) {
  const players = team.players.filter((player) => player.status !== "inactive");
  return (
    <details className={actionCard}>
      <summary className={`${actionSummary} grid-cols-[44px_1fr_auto]`}>
        <span className="grid h-[36px] w-[36px] place-items-center rounded-[11px] bg-navy font-[900] text-[#f5a313]">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="grid gap-[4px]">
          <b className="text-[15px]">{team.name}</b>
          <small className="text-[13px] leading-[1.35] text-muted">
            {players.length} player{players.length === 1 ? "" : "s"}
          </small>
        </span>
        <strong aria-hidden="true" className={caret}>
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className={gameForm}>
        <TeamLeadershipEditor team={team} />
        {players.length ? (
          players.map((player) => <TeamPlayerRow key={player.registrationId} player={player} />)
        ) : (
          <p className={emptyNote}>No active players yet.</p>
        )}
      </div>
    </details>
  );
}

function TeamPlayerRow({ player }: { player: OwnerRosterPlayer }) {
  const [state, action, pending] = useActionState(returnPlayerToDraftPoolAction, initialState);
  return (
    <details className="overflow-hidden rounded-[10px] border border-line">
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-[10px] p-[11px_12px] [&::-webkit-details-marker]:hidden">
        <span className="grid min-w-0 gap-[3px]">
          <b className="text-[14px] leading-[1.2]">{player.name}</b>
          <small className="text-[11px] leading-[1.25] whitespace-normal text-muted">
            #{player.jerseyNumber ?? "—"} · {player.position || "Position not set"} · {player.role}
          </small>
        </span>
        <strong aria-hidden="true" className="text-[18px]">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={action} className={`${ownerForm} border-t border-line p-[12px]`}>
        <input type="hidden" name="registrationId" value={player.registrationId} />
        <label>
          Reason for returning to the draft pool
          <textarea
            name="reason"
            maxLength={500}
            required
            placeholder="Roster correction, trade, or replacement…"
          />
        </label>
        <Feedback state={state} />
        <button className="btn secondary" disabled={pending || player.role !== "Player"}>
          {pending
            ? "Returning…"
            : player.role === "Player"
              ? "Return to Draft Pool"
              : "Captains cannot be removed here"}
        </button>
      </form>
    </details>
  );
}
