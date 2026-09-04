"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import styles from "./OwnerTeams.module.css";
import directoryStyles from "./OwnerDirectory.module.css";
import {
  addConferencePlayerAction,
  advanceSeasonSetupAction,
  assignDirectoryLeaderAction,
  assignDraftPlayerAction,
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
  moveExistingDivisionPlayerAction,
  publishDivisionFinalRosterAction,
  publishDivisionRosterAction,
  rescheduleGameAction,
  returnPlayerToDraftPoolAction,
  reviewPaymentNoticeAction,
  reviewRosterChangeRequestAction,
  reviewTeamRosterAction,
  saveDivisionGameDayAction,
  saveDivisionPreseasonAction,
  sendLateTeamInvitationAction,
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
function DivisionJoinLink({ divisionId }: { divisionId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${divisionId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="division-join-link">
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
    <form action={action} className="owner-form season-create-form">
      <input type="hidden" name="conferenceId" value={conferenceId} />
      <input type="hidden" name="divisionName" value="" />
      <div className="season-create-grid">
        <label className="season-name-field">
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

export function ConferencePlayerDirectory({ conferenceId }: { conferenceId: string }) {
  const [state, action, pending] = useActionState(addConferencePlayerAction, initialState);
  return (
    <details className="card owner-section conference-player-directory">
      <summary>
        <span className="owner-section-title">
          <span className="owner-icon">＋</span>
          <span>
            <h2>Add a confirmed player</h2>
            <p>Only needed when someone new must be added to this conference.</p>
          </span>
          <strong>›</strong>
        </span>
      </summary>
      <form action={action} className="owner-form">
        <input type="hidden" name="conferenceId" value={conferenceId} />
        <label>
          Player account code
          <input
            name="publicPlayerId"
            placeholder="KCH-XXXXXXXX"
            autoCapitalize="characters"
            required
          />
        </label>
        <p className="field-help">
          This code is only used to match the right confirmed account. It is not shown in the Teams
          view.
        </p>
        <Feedback state={state} />
        <button className="btn secondary" disabled={pending}>
          {pending ? "Adding…" : "Add Player"}
        </button>
      </form>
    </details>
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
    <form action={action} className="advance-step-form">
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

function DivisionSetupStep({ season }: { season: OwnerSeason }) {
  const [state, action, pending] = useActionState(createDivisionsAction, initialState);
  const [divisionCount, setDivisionCount] = useState(1);
  const remaining = Math.max(0, 10 - season.divisions.length);
  return (
    <div className="guided-step-body">
      <p className="guided-instruction">
        Create every division for <b>{season.name}</b> together. A season can have up to 10
        divisions, and another division can be added later.
      </p>
      {season.divisions.length > 0 && (
        <div className="setup-chips">
          {season.divisions.map((division) => (
            <span key={division.id}>✓ {division.name}</span>
          ))}
        </div>
      )}
      {remaining > 0 && (
        <form action={action} className="owner-form batch-setup-form">
          <input type="hidden" name="seasonId" value={season.id} />
          <label className="batch-count-field">
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
          <div className="batch-name-grid">
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
          <button className="btn secondary batch-save-button" disabled={pending}>
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
    <details className="guided-group" open>
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {division.teams.length} team{division.teams.length === 1 ? "" : "s"} saved
          </small>
        </span>
        <span>›</span>
      </summary>
      <div>
        {division.teams.length > 0 && (
          <div className="setup-chips">
            {division.teams.map((team) => (
              <span key={team.id}>✓ {team.name}</span>
            ))}
          </div>
        )}
        <form action={action} className="owner-form batch-setup-form">
          <input type="hidden" name="divisionId" value={division.id} />
          <label className="batch-count-field">
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
          <div className="batch-name-grid">
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
          <button className="btn secondary batch-save-button" disabled={pending}>
            {pending ? "Saving teams…" : `Save ${teamCount} Team${teamCount === 1 ? "" : "s"}`}
          </button>
        </form>
      </div>
    </details>
  );
}

function TeamsSetupStep({ season }: { season: OwnerSeason }) {
  return (
    <div className="guided-step-body">
      <p className="guided-instruction">
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
    <details className="guided-subform leader-search" open={currentName === "Unassigned"}>
      <summary>
        {role}: {currentName}
      </summary>
      <form action={action} className="owner-form">
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
          <div className="leader-search-results">
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
          <p className="leader-selected">
            ✓ Selected: <b>{selected.name}</b>
          </p>
        )}
        <p className="field-help">
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
    <div className="guided-step-body">
      <p className="guided-instruction">
        Search the conference player directory to assign each captain and co-captain. Leaders
        register like every other player and cannot lead two teams in the same season.
      </p>
      <aside className="leader-suggestions">
        <small>FAKE PLAYERS TO TRY</small>
        <div>
          {suggestions.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </aside>
      {teams.map((team) => (
        <details className="guided-group" key={team.id}>
          <summary>
            <span>
              <b>{team.name}</b>
              <small>
                Captain: {team.captain} · Co-captain: {team.coCaptain}
              </small>
            </span>
            <span>›</span>
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
    <details className="guided-group preseason-division" open={!division.preseasonConfigured}>
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {division.preseasonConfigured
              ? `League ${division.leagueFeeEnabled ? money(division.leagueFee) : "off"} · Uniform ${division.uniformFeeEnabled ? money(division.uniformFee) : "off"}`
              : "Fees not saved"}
          </small>
        </span>
        <span>›</span>
      </summary>
      <div>
        {previousDivisions.length > 0 && (
          <form action={copyAction} className="owner-form reuse-uniform-form">
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
        <form action={action} className="owner-form preseason-form">
          <input type="hidden" name="divisionId" value={division.id} />
          <fieldset className="fee-toggle-card">
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
          <fieldset className="fee-toggle-card">
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
          <div className="uniform-upload-grid">
            <label>
              <span>
                Dark uniform <small>(optional)</small>
              </span>
              {division.darkImage ? (
                <img src={division.darkImage} alt={`${division.name} dark uniform`} />
              ) : (
                <i>📷</i>
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
                <i>📷</i>
              )}
              <input name="lightImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
          </div>
          <p className="field-help">
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
    <div className="guided-step-body">
      <p className="guided-instruction">
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
      <form action={action} className="advance-step-form">
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
      <details className="division-invitation sent" open={open}>
        <summary>
          <span>
            <b>{division.name}</b>
            <small>{division.invitationCount} invited · Final roster published</small>
          </span>
          <em>LOCKED</em>
          <strong>›</strong>
        </summary>
        <div className="division-invitation-locked">
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
      className={`division-invitation ${division.invitationSent ? "sent" : "needs-invitation"}`}
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
        <strong>›</strong>
      </summary>
      <form action={action} className="owner-form division-invitation-form">
        <input type="hidden" name="divisionId" value={division.id} />
        <section className="invitation-plan">
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
        <p className="field-help">
          {captainCount
            ? `${captainCount} captain${captainCount === 1 ? " is" : "s are"} already counted. Select the additional players who should receive this invitation.`
            : "Choose the players who should receive this division invitation."}
        </p>
        <label>
          Choose players to invite <small>(nobody is selected by default)</small>
        </label>
        <div className="invitation-player-list">
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
            <p className="empty-note">Add KCH players to this conference directory first.</p>
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
        <p className="field-help">
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
          <button type="button" className="restore-message" onClick={() => setCustomized(false)}>
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
    <div className="guided-step-body">
      <p className="guided-instruction">
        Choose exactly who receives each division invitation. This workspace stays open during
        drafting, so you can add a new KCH player later without disturbing earlier responses.
      </p>
      <div className="invitation-progress">
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
    <details className={`team-draft-review ${team.draftStatus}`}>
      <summary>
        <span>
          <b>{team.name}</b>
          <small>
            {team.captain} · {playerCount} players
          </small>
        </span>
        <em>{statusLabel}</em>
        <strong>›</strong>
      </summary>
      <div className="team-review-body">
        <div className="team-review-roster">
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
          {!roster.length && <p className="empty-note">No players assigned to this team.</p>}
        </div>
        {(team.draftStatus === "submitted" ||
          (allowChanges && team.draftStatus === "approved")) && (
          <form action={action} className="team-review-form">
            <input type="hidden" name="teamId" value={team.id} />
            <Feedback state={state} />
            <div className="draft-review-actions compact">
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
    <article className="roster-change-review">
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
      {request.ownerNote && <p className="owner-review-note">Owner: {request.ownerNote}</p>}
      {request.status === "pending" && (
        <form action={action} className="owner-form">
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
          <div className="draft-review-actions">
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
    <details className="card owner-section roster-change-panel" open={pending.length > 0}>
      <summary>
        <span>
          <b>Captain Change Requests</b>
          <small>{pending.length} awaiting owner approval</small>
        </span>
        <strong>›</strong>
      </summary>
      <div>
        {requests.slice(0, 10).map((request) => (
          <RosterRequestReview key={request.id} request={request} />
        ))}
      </div>
    </details>
  );
}

function LateInvitationForm({
  directory,
  seasons,
}: {
  directory: OwnerDirectoryPlayer[];
  seasons: OwnerSeason[];
}) {
  const [lateState, lateAction, latePending] = useActionState(
    sendLateTeamInvitationAction,
    initialState,
  );
  const [moveState, moveAction, movePending] = useActionState(
    moveExistingDivisionPlayerAction,
    initialState,
  );
  const [isMove, setIsMove] = useState(false),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<OwnerDirectoryPlayer | null>(null),
    [selectedMove, setSelectedMove] = useState<{
      registrationId: string;
      name: string;
      email: string;
      teamId: string;
    } | null>(null),
    [targetTeamId, setTargetTeamId] = useState("");
  const teams = seasons
    .filter((season) => !season.canceledAt)
    .flatMap((season) =>
      season.divisions.flatMap((division) =>
        division.teams
          .filter((team) => team.active)
          .map((team) => ({
            id: team.id,
            divisionId: division.id,
            label: `${season.name} — ${division.name} — ${team.name}`,
          })),
      ),
    );
  const players = directory.filter((player) => player.claimed);
  const rosterPlayers = seasons
    .filter((season) => !season.canceledAt)
    .flatMap((season) =>
      season.divisions.flatMap((division) =>
        division.teams.flatMap((team) =>
          team.players
            .filter((player) => player.status === "active" && player.role !== "Captain")
            .map((player) => ({
              registrationId: player.registrationId,
              name: player.name,
              email: player.email,
              teamId: team.id,
              divisionId: division.id,
            })),
        ),
      ),
    );
  const normalized = query.trim().toLowerCase();
  const lateMatches =
    normalized.length < 2
      ? []
      : players
          .filter(
            (player) =>
              player.name.toLowerCase().includes(normalized) ||
              player.email.toLowerCase().includes(normalized),
          )
          .slice(0, 6);
  const moveMatches =
    normalized.length < 2
      ? []
      : rosterPlayers
          .filter(
            (player) =>
              player.name.toLowerCase().includes(normalized) ||
              player.email.toLowerCase().includes(normalized),
          )
          .slice(0, 6);
  const availableTeams =
    isMove && selectedMove
      ? teams.filter(
          (team) =>
            team.divisionId ===
              rosterPlayers.find((player) => player.registrationId === selectedMove.registrationId)
                ?.divisionId && team.id !== selectedMove.teamId,
        )
      : teams;
  const resetSelection = () => {
    setQuery("");
    setSelected(null);
    setSelectedMove(null);
  };
  if (!players.length || !teams.length) return null;
  return (
    <details className="card owner-section conference-player-directory">
      <summary>
        <span className="owner-section-title">
          <span className="owner-icon">＋</span>
          <span>
            <h2>Add late invitation or move players</h2>
            <p>Only for last minute player addition.</p>
          </span>
          <strong>›</strong>
        </span>
      </summary>
      <form action={isMove ? moveAction : lateAction} className="owner-form">
        <input
          type="hidden"
          name={isMove ? "registrationId" : "playerId"}
          value={isMove ? (selectedMove?.registrationId ?? "") : (selected?.id ?? "")}
        />
        <label className="check-row">
          <input
            type="checkbox"
            checked={isMove}
            onChange={(event) => {
              setIsMove(event.target.checked);
              setTargetTeamId("");
              resetSelection();
            }}
          />{" "}
          Move an existing player in this division
        </label>
        <label>
          Search player name
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setTargetTeamId("");
              setSelected(null);
              setSelectedMove(null);
            }}
            placeholder="Type at least 2 letters"
            autoComplete="off"
          />
        </label>
        {normalized.length >= 2 && (
          <div className="leader-search-results">
            {isMove ? (
              moveMatches.length ? (
                moveMatches.map((player) => (
                  <button
                    type="button"
                    key={player.registrationId}
                    onClick={() => {
                      setSelectedMove(player);
                      setQuery(player.name);
                    }}
                  >
                    <b>{player.name}</b>
                    <small>{player.email || "No email"}</small>
                  </button>
                ))
              ) : (
                <p>No player found.</p>
              )
            ) : lateMatches.length ? (
              lateMatches.map((player) => (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => {
                    setSelected(player);
                    setQuery(player.name);
                  }}
                >
                  <b>{player.name}</b>
                  <small>{player.email || "No email"}</small>
                </button>
              ))
            ) : (
              <p>No player found.</p>
            )}
          </div>
        )}
        {(isMove ? selectedMove : selected) && (
          <p className="leader-selected">
            ✓ Selected: <b>{isMove ? selectedMove?.name : selected?.name}</b>
          </p>
        )}
        <label>
          Team
          <select
            name="teamId"
            value={targetTeamId}
            onChange={(event) => setTargetTeamId(event.target.value)}
            required
            disabled={isMove && !selectedMove}
          >
            <option value="" disabled>
              {isMove && !selectedMove ? "Select player first" : "Select team"}
            </option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </select>
        </label>
        <Feedback state={isMove ? moveState : lateState} />
        <button
          className="btn primary"
          disabled={
            isMove
              ? movePending || !selectedMove || !targetTeamId
              : latePending || !selected || !targetTeamId
          }
        >
          {isMove
            ? movePending
              ? "Moving…"
              : "Move Player"
            : latePending
              ? "Sending…"
              : "Send Late Invitation"}
        </button>
      </form>
    </details>
  );
}

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
    <section className="owner-operations owner-page-section">
      <p className="operations-intro">
        Open a season, then a division, to see each team&apos;s simple roster.
      </p>
      {available.length ? (
        <div className="uniform-season-list">
          {available.map((season, index) => (
            <details className="operations-season card" key={season.id} open={index === 0}>
              <summary>
                <span>
                  <b>{season.name}</b>
                  <small>
                    {season.divisions.reduce((total, division) => total + division.teams.length, 0)}{" "}
                    teams · {season.divisions.length} division
                    {season.divisions.length === 1 ? "" : "s"}
                  </small>
                </span>
                <strong>›</strong>
              </summary>
              <div>
                {season.divisions.map((division) => (
                  <details className="game-action-card" key={division.id}>
                    <summary>
                      <span className="owner-icon">♟</span>
                      <span>
                        <b>{division.name}</b>
                        <small>
                          {division.teams.length} team{division.teams.length === 1 ? "" : "s"}
                        </small>
                      </span>
                      <strong>›</strong>
                    </summary>
                    <div className="game-form">
                      <div className="owner-team-list">
                        {division.teams.length ? (
                          division.teams.map((team) => <TeamEditor key={team.id} team={team} />)
                        ) : (
                          <p className="empty-note">No teams in this division yet.</p>
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
        <p className="empty-note">No active seasons yet. Create a season from Home first.</p>
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
        <strong>›</strong>
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
          <p className="eyebrow">PLAYER DIRECTORY</p>
          <h2>Conference Players</h2>
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
        <LateInvitationForm
          directory={directory.filter((player) => player.status === "active")}
          seasons={seasons}
        />
        <ConferencePlayerDirectory conferenceId={conferenceId} />
        <section className="card owner-section player-directory-list">
          {directory.length ? (
            <div className={directoryStyles.list}>
              {directory.map((player) => (
                <DirectoryPlayer conferenceId={conferenceId} player={player} key={player.id} />
              ))}
            </div>
          ) : (
            <p className="empty-note">No KCH players have been added to this conference yet.</p>
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
    <details className="mobile-draft-list">
      <summary>
        <span>
          <b>Responded Players</b>
          <small>{players.length} responses · Tap to view the draft list</small>
        </span>
        <strong>›</strong>
      </summary>
      <div className="draft-list-filters">
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
      {!visible.length && <p className="empty-note">No players in this view.</p>}
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
    <details className="owner-draft-override">
      <summary>
        <span>
          <b>Owner override: assign a player</b>
          <small>
            Use only when you need to place a player for a captain. Every override is recorded in
            the owner activity history.
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <form action={action} className="owner-form">
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
        <div className="compact-fields">
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
      <section className="division-roster-shared final">
        <b>✓ Final roster published for {division.name}</b>
        <small>Everyone joining this division can see the final team assignments.</small>
      </section>
    );
  if (division.rosterPublished && !division.rosterReviewDeadline)
    return (
      <form
        action={deadlineAction}
        className="owner-form division-publish-form roster-review-form compact"
      >
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
      <section className="division-final-publish">
        <div className="division-roster-shared review">
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
          <p className="roster-final-note">
            {division.teams.length - approved} updated team roster
            {division.teams.length - approved === 1 ? " is" : "s are"} waiting for approval.
          </p>
        )}
        <form action={finalAction} className="owner-form division-publish-form">
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
    <form action={action} className="owner-form division-publish-form">
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
    <div className="guided-step-body">
      <p className="guided-instruction">
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
            className="division-draft-pool"
            key={division.id}
            open={index === 0 || !division.rosterFinalPublished}
          >
            <summary>
              <span>
                <b>{division.name}</b>
                <small>{divisionStatus}</small>
              </span>
              <strong>›</strong>
            </summary>
            <div>
              <button
                type="button"
                className="btn primary draft-sheet-download"
                onClick={() => downloadDivisionDraftSheet(season, division)}
              >
                ↓ Download {division.name} Draft Sheet
              </button>
              <p className="draft-file-note">
                The download remains available for owners who want a printed or computer-based
                draft.
              </p>
              <DivisionRespondedPlayers players={responded} />
              {notJoining.length > 0 && (
                <p className="division-response-note">
                  Players marked “Not joining” remain visible under All so the owner has a complete
                  response record.
                </p>
              )}
              <OwnerDraftOverride division={division} players={divisionInvitees} />
              <div className="team-draft-review-list">
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
      <p className="captain-handoff-note">
        Players review every team assignment during the deadline window. Final rosters are then
        published separately for each division.
      </p>
    </div>
  );
}

function ScheduleSetupStep({ season }: { season: OwnerSeason }) {
  return (
    <div className="guided-step-body">
      <p className="guided-instruction">
        Open one division at a time. Choose manual scheduling or let KCH create a draft on the
        Schedule page.
      </p>
      <div className="step-eight-division-list">
        {season.divisions.map((division) => {
          const games = season.games.filter((game) => game.divisionId === division.id).length;
          return (
            <article className={`step-eight-division ${division.scheduleStatus}`} key={division.id}>
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
      <p className="captain-handoff-note">
        Every division creates and finalizes its own schedule. One division never waits for another.
      </p>
    </div>
  );
}

function CancelSeasonForm({ season }: { season: OwnerSeason }) {
  const [state, action, pending] = useActionState(cancelSeasonAction, initialState);
  return (
    <details className="cancel-season">
      <summary>Cancel this season</summary>
      <form action={action} className="owner-form">
        <input type="hidden" name="seasonId" value={season.id} />
        <p className="field-help">
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
        <button className="btn cancel-button" disabled={pending}>
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
    <details className="season-expansion-card">
      <summary>
        <span>
          <b>{season.name}</b>
          <small>{season.divisions.length} of 10 divisions · Keep this season and expand it</small>
        </span>
        <strong>›</strong>
      </summary>
      <div>
        {remaining > 0 ? (
          <form action={action} className="owner-form batch-setup-form">
            <input type="hidden" name="seasonId" value={season.id} />
            <label className="batch-count-field">
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
            <div className="batch-name-grid">
              {Array.from({ length: Math.min(divisionCount, remaining) }, (_, index) => (
                <label key={index}>
                  New division {index + 1}
                  <input name="divisionName" placeholder="Division name" maxLength={80} required />
                </label>
              ))}
            </div>
            <Feedback state={state} />
            <button className="btn secondary batch-save-button" disabled={pending}>
              {pending ? "Adding…" : "Add to This Season"}
            </button>
          </form>
        ) : (
          <p className="empty-note">This season already has the maximum of 10 divisions.</p>
        )}
        {divisionsNeedingTeams.length > 0 && (
          <section className="expansion-next-step">
            <p className="guided-instruction">New divisions ready for teams:</p>
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
      <div className="setup-wizard">
        <details className="guided-step current" open>
          <summary>
            <b className="step-number">1</b>
            <span>
              <small>STEP 1 OF 8</small>
              <h2>Season</h2>
            </span>
            <span className="step-state">
              <em>Choose a path</em>
              <strong>›</strong>
            </span>
          </summary>
          <div className="guided-step-body">
            <section className="season-path">
              <h3>Create a New Season</h3>
              <p className="guided-instruction">Start a separate season inside {conferenceName}.</p>
              <CreateSeasonForm conferenceId={conferenceId} />
            </section>
            {completed.length > 0 && (
              <section className="season-path">
                <h3>Use the Same Season</h3>
                <p className="guided-instruction">
                  Add another division after setup is complete. Existing divisions, teams, rosters,
                  payments, and schedules stay unchanged.
                </p>
                {completed.map((season) => (
                  <ExpandExistingSeason key={season.id} season={season} />
                ))}
              </section>
            )}
          </div>
        </details>
        {setupLabels.slice(1).map((label, index) => (
          <section className="guided-step locked" key={label}>
            <header>
              <b className="step-number">{index + 2}</b>
              <span>
                <small>STEP {index + 2} OF 8</small>
                <h2>{label}</h2>
              </span>
              <span className="step-state">
                <em>Locked</em>
              </span>
            </header>
          </section>
        ))}
        <div className="completed-seasons">
          {published.map((season) => (
            <span className={season.canceledAt ? "canceled" : ""} key={season.id}>
              {season.canceledAt ? "×" : "✓"} {season.name}{" "}
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
      <p className="step-summary">
        {activeSeason.name} · {activeSeason.startsOn} to {activeSeason.endsOn}
      </p>
    ) : step === 2 ? (
      <p className="step-summary">
        {activeSeason.divisions.length} division{activeSeason.divisions.length === 1 ? "" : "s"}{" "}
        added
      </p>
    ) : step === 3 ? (
      <p className="step-summary">
        {activeSeason.divisions.reduce((sum, division) => sum + division.teams.length, 0)} teams
        added
      </p>
    ) : step === 4 ? (
      <p className="step-summary">Captains and co-captains established</p>
    ) : step === 5 ? (
      <p className="step-summary">Division fees and dark/light uniforms prepared</p>
    ) : step === 6 ? (
      <p className="step-summary">
        {activeSeason.invitees.length} players invited ·{" "}
        {activeSeason.invitees.filter((invitee) => invitee.response === "joining").length} joining
      </p>
    ) : step === 7 ? (
      <p className="step-summary">Roster draft published to players and captains</p>
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
    <div className="setup-wizard">
      <section className="setup-context">
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
        const heading = (
          <>
            <b className="step-number">{completed && !invitationWorkspace ? "✓" : visualStep}</b>
            <span>
              <small>STEP {visualStep} OF 8</small>
              <h2>{label}</h2>
            </span>
            <span className="step-state">
              <em>{status}</em>
              {!locked && <strong>›</strong>}
            </span>
          </>
        );
        return locked ? (
          <section key={label} className="guided-step locked">
            <header>{heading}</header>
          </section>
        ) : (
          <details
            key={label}
            className={`guided-step ${completed ? "completed" : current ? "current" : "available"}`}
            open={current || invitationWorkspace}
          >
            <summary>{heading}</summary>
            {completed ? (
              <>
                {reviewFor(visualStep)}
                {invitationWorkspace && bodyFor(visualStep)}
              </>
            ) : (
              bodyFor(visualStep)
            )}
          </details>
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
    <form action={action} className="owner-form manual-game-day">
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
      <div className="compact-fields">
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
      <p className="field-help">Each team can play only once on this game day.</p>
      <div className="manual-game-rows">
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
                className="remove-game-row"
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              >
                Remove
              </button>
            )}
          </fieldset>
        ))}
      </div>
      <button type="button" className="btn secondary add-game-row" onClick={add}>
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
    <form action={action} className="owner-form schedule-builder-form">
      <input type="hidden" name="divisionId" value={division.id} />
      <div className="compact-fields">
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
      <fieldset className="playing-days">
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
      <div className="compact-fields">
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
      <p className="field-help">
        KCH schedules each team only once per day, even when more court time is available.
      </p>
      <label className="check-row">
        <input name="doubleRoundRobin" type="checkbox" /> Home and away double round-robin
      </label>
      <div className="schedule-build-summary">
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
    <details className={`matchup-progress ${missing.length ? "incomplete" : "complete"}`}>
      <summary>
        <span>
          <b>
            {missing.length ? `${missing.length} Matchups Still Needed` : "Round Robin Complete"}
          </b>
          <small>
            {complete} of {total} unique matchups scheduled
          </small>
        </span>
        <strong>›</strong>
      </summary>
      {missing.length ? (
        <div>
          {missing.map(([home, away]) => (
            <span key={`${home.id}-${away.id}`}>
              {home.name} <b>vs</b> {away.name}
            </span>
          ))}
        </div>
      ) : (
        <p>Every team has been matched once. This draft can be finalized.</p>
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
      <section className="division-schedule-final">
        <b>✓ Final Schedule</b>
        <small>Players in {division.name} can now see these games.</small>
      </section>
    );
  return (
    <form action={action} className="schedule-finalize-panel">
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
    <details className="game-action-card">
      <summary>
        <span className="owner-icon">＋</span>
        <span>
          <b>{playoffAvailable ? "Add Regular or Playoff Game" : "Add a Regular-Season Game"}</b>
          <small>
            {playoffAvailable
              ? "Round robin complete · Playoffs unlocked"
              : `${regularGamesRemaining} round-robin result${regularGamesRemaining === 1 ? "" : "s"} remaining before playoffs`}
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <form action={action} className="owner-form game-form">
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
        <p className="auto-assignment-note">
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
    <section className="game-change-panel cancel-game-panel">
      <header>
        <b>Cancel Game</b>
        <small>Use only if this game will not be played.</small>
      </header>
      <form action={action} className="owner-form">
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
      <article id={`game-${game.id}`} className="game-action-card existing-game">
        <div className="game-editor-summary">{summary}</div>
      </article>
    );
  return (
    <details
      id={`game-${game.id}`}
      className={`game-action-card existing-game game-${game.status}`}
    >
      <summary>
        <span>{summary}</span>
        <strong>›</strong>
      </summary>
      <section className="game-change-panel update-schedule-panel">
        <header>
          <b>Update Schedule</b>
          <small>Change the game details and notify both teams.</small>
        </header>
        <form action={action} className="owner-form game-form">
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
    <section className="weekly-schedule">
      <header>
        <div>
          <small>WEEKLY VIEW</small>
          <h3>All Teams</h3>
          <p>{sorted.length} total scheduled games</p>
        </div>
      </header>
      <div className="weekly-schedule-list">
        {weeks.map(([key, games], weekIndex) => {
          const end = new Date(`${key}T12:00:00Z`);
          end.setUTCDate(end.getUTCDate() + 6);
          return (
            <details className="schedule-week" key={key} open={weekIndex === 0}>
              <summary>
                <span>
                  {displayDate(key)} – {displayDate(end.toISOString().slice(0, 10))}
                </span>
                <small>
                  {games.length} game{games.length === 1 ? "" : "s"}
                </small>
                <strong>›</strong>
              </summary>
              <div className="schedule-table-scroll">
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
                            <em className={`game-phase ${game.phase}`}>
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
                            <em className={`schedule-status ${game.status}`}>{game.status}</em>
                          </td>
                          <td>
                            <a className="schedule-update" href={`/owner/scores#score-${game.id}`}>
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
    <section className="schedule-method-picker">
      <div className="schedule-choice-grid">
        <button
          type="button"
          style={{
            minHeight: 96,
            padding: 12,
            textAlign: "left",
            borderColor: method === "manual" ? "#d18408" : undefined,
            background: method === "manual" ? "#fffbf3" : undefined,
          }}
          className="schedule-choice-card"
          onClick={() => choose("manual")}
          aria-expanded={method === "manual"}
        >
          <span>✎</span>
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
          className="schedule-choice-card kch-choice"
          onClick={() => choose("automate")}
          aria-expanded={method === "automate"}
        >
          <span>✦</span>
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
      className={`division-operation division-schedule-${division.scheduleStatus}`}
      open={division.rosterFinalPublished && division.scheduleStatus !== "final"}
    >
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {division.teams.length} teams · {divisionGames.length} games
          </small>
        </span>
        <em
          className={`schedule-finality ${division.scheduleStatus === "final" ? "final" : "draft"}`}
        >
          {status}
        </em>
        <strong>›</strong>
      </summary>
      <div>
        {!division.rosterFinalPublished ? (
          <p className="empty-note">
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
                  <details className="schedule-method-card continue-manual">
                    <summary>
                      <span>＋</span>
                      <span>
                        <b>Add Another Game Day</b>
                        <small>Save the next day&apos;s games as one group.</small>
                      </span>
                      <strong>›</strong>
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
                <section className="scheduled-games">
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
    <details className="operations-season card" open={index === 0}>
      <summary>
        <span>
          <b>{season.name}</b>
          <small>
            {season.games.length} total games · {finalized} of {season.divisions.length} division
            schedules final
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <div>
        <div className="division-operation-list">
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
      <section className="card owner-empty-operation">
        <span>▦</span>
        <div>
          <h3>No schedule workspace yet</h3>
          <p>Complete the roster draft in Season Setup to begin Step 8.</p>
        </div>
      </section>
    );
  return (
    <section className="owner-operations owner-page-section">
      <p className="operations-intro">
        Choose a season, then a division. Each division keeps its own schedule, teams, and results.
      </p>
      {current.length ? (
        <div className="owner-schedule-current">
          {current.map((season, index) => (
            <ScheduleSeasonOperations season={season} index={index} key={season.id} />
          ))}
        </div>
      ) : (
        <p className="empty-note">No current schedules. Completed seasons are available below.</p>
      )}
      {completed.length ? (
        <details className="owner-schedule-archive">
          <summary>
            <span>
              <b>Season Archive</b>
              <small>
                {completed.length} completed season{completed.length === 1 ? "" : "s"}
              </small>
            </span>
            <strong>›</strong>
          </summary>
          {completed.map((season) => (
            <details className="operations-season card" key={season.id}>
              <summary>
                <span>
                  <b>{season.name}</b>
                  <small>
                    {season.games.length} game{season.games.length === 1 ? "" : "s"} · completed
                  </small>
                </span>
                <strong>›</strong>
              </summary>
              <div>
                <WeeklyScheduleTable season={season} />
                <p className="empty-note">Completed schedules are kept here as a record.</p>
              </div>
            </details>
          ))}
        </details>
      ) : null}
    </section>
  );
}

function PaymentReviewCard({ submission }: { submission: OwnerPaymentSubmission }) {
  const [state, action, pending] = useActionState(reviewPaymentNoticeAction, initialState);
  const isWaiver = submission.method === "waiver";
  return (
    <details className={`payment-review-card ${isWaiver ? "waiver-review-card" : ""}`}>
      <summary>
        <span className="payment-review-icon">
          {isWaiver ? "◇" : submission.method === "zelle" ? "ℤ" : "▣"}
        </span>
        <span>
          <b>{submission.playerName}</b>
          <small>
            {isWaiver ? "Waiver request" : "Payment notice"} · {submission.feeLabel} · $
            {submission.amount.toFixed(2)}
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <form action={action} className="owner-form">
        <input type="hidden" name="submissionId" value={submission.id} />
        <div className="payment-review-facts">
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
        <p className="payment-reference">
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
        <div className="payment-review-actions">
          <button
            className="btn confirm-payment"
            name="decision"
            value="confirmed"
            disabled={pending}
          >
            {isWaiver ? "Approve Waiver" : "Confirm Received"}
          </button>
          <button
            className="btn decline-payment"
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

export function OwnerPaymentManagement({
  submissions,
  groups,
}: {
  submissions: OwnerPaymentSubmission[];
  groups: OwnerPaymentGroup[];
}) {
  const pending = submissions.filter((submission) => submission.status === "pending");
  return (
    <section className="owner-operations payment-operations owner-page-section">
      {pending.length > 0 && (
        <section className="payment-review-section">
          <p className="eyebrow">NEEDS ATTENTION</p>
          <h2>Payment Confirmations</h2>
          <p className="operations-intro">
            Only confirmed Zelle or cash notices change the player&apos;s balance.
          </p>
          <div className="payment-review-list">
            {pending.map((submission) => (
              <PaymentReviewCard submission={submission} key={submission.id} />
            ))}
          </div>
        </section>
      )}
      <section className="payment-season-tracking">
        <h2>Season Tracking</h2>
        <p className="operations-intro">
          Each card contains one season and division. Open it for player-level details.
        </p>
        {groups.length ? (
          <div className="payment-season-list">
            {groups.map((group) => (
              <details className="payment-season payment-division-card card" key={group.divisionId}>
                <summary>
                  <span>
                    <b>
                      {group.seasonName} · {group.divisionName}
                    </b>
                    <small>
                      {group.totalPlayers} rostered players · {money(group.perPlayerTotal)} per
                      player
                    </small>
                  </span>
                  <span className="payment-season-due">
                    <small>NOT PAID</small>
                    <b>{group.unpaidPlayers}</b>
                  </span>
                  <strong>›</strong>
                </summary>
                <div className="payment-season-body">
                  <p className="payment-card-label">PLAYER PAYMENT STATUS</p>
                  <div className="payment-count-grid">
                    <span className="paid">
                      <small>PAID</small>
                      <b>{group.paidPlayers}</b>
                    </span>
                    <span className="unpaid">
                      <small>NOT PAID</small>
                      <b>{group.unpaidPlayers}</b>
                    </span>
                    <span>
                      <small>WAIVED</small>
                      <b>{group.waivedPlayers}</b>
                    </span>
                  </div>
                  <p className="payment-card-label">PAID PLAYERS BY METHOD</p>
                  <div className="payment-method-counts">
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
                  <p className="payment-card-label">SEASON / DIVISION INCOME</p>
                  <div className="payment-division-stats">
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
                  <details className="payment-player-details">
                    <summary>
                      <span>
                        <b>Player Payment Details</b>
                        <small>Paid, not paid, waived, and payment method</small>
                      </span>
                      <strong>›</strong>
                    </summary>
                    <div className="payment-player-list">
                      {group.players.map((player) => (
                        <article className="payment-player-row" key={player.registrationId}>
                          <header>
                            <span>
                              <b>{player.playerName}</b>
                              <small>{player.teamName}</small>
                            </span>
                            <em
                              className={`payment-player-status status-${player.pendingReview ? "review" : player.status.toLowerCase()}`}
                            >
                              {player.pendingReview ? "Pending review" : player.status}
                            </em>
                          </header>
                          <div className="payment-player-amounts">
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
          <section className="card owner-empty-operation">
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
    <section className="owner-operations payment-operations owner-page-section">
      <h2>Completed Seasons</h2>
      <p className="operations-intro">Previous-season payment records stay here for reference.</p>
      {groups.length ? (
        <div className="payment-season-list">
          {groups.map((group) => (
            <details className="payment-season payment-division-card card" key={group.divisionId}>
              <summary>
                <span>
                  <b>
                    {group.seasonName} · {group.divisionName}
                  </b>
                  <small>
                    {group.totalPlayers} rostered players · {money(group.received)} received
                  </small>
                </span>
                <strong>›</strong>
              </summary>
              <div className="payment-season-body">
                <div className="payment-division-stats">
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
                <details className="payment-player-details">
                  <summary>
                    <span>
                      <b>Player Payment Details</b>
                      <small>Read-only payment history</small>
                    </span>
                    <strong>›</strong>
                  </summary>
                  <div className="payment-player-list">
                    {group.players.map((player) => (
                      <article className="payment-player-row" key={player.registrationId}>
                        <header>
                          <span>
                            <b>{player.playerName}</b>
                            <small>{player.teamName}</small>
                          </span>
                          <em
                            className={`payment-player-status status-${player.pendingReview ? "review" : player.status.toLowerCase()}`}
                          >
                            {player.pendingReview ? "Pending review" : player.status}
                          </em>
                        </header>
                        <div className="payment-player-amounts">
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
        <p className="empty-note">No completed-season payments yet.</p>
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
    <details className="uniform-settings-card">
      <summary>
        <span className="owner-team-mark">{division.name.slice(0, 2).toUpperCase()}</span>
        <span>
          <b>{division.name}</b>
          <small>
            {seasonName} · {division.teams.length} teams · Dark &amp; Light photos
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <div className="division-uniform-editor">
        <form action={photoAction} className="owner-form uniform-photo-upload">
          <input type="hidden" name="divisionId" value={division.id} />
          <div className="uniform-upload-grid">
            <label>
              <span>Dark</span>
              {division.darkImage ? (
                <img src={division.darkImage} alt={`${division.name} dark uniform`} />
              ) : (
                <i>📷</i>
              )}
              <input name="darkImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label>
              <span>Light</span>
              {division.lightImage ? (
                <img src={division.lightImage} alt={`${division.name} light uniform`} />
              ) : (
                <i>📷</i>
              )}
              <input name="lightImage" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
          </div>
          <p className="field-help">
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
    <section className="owner-operations owner-page-section uniform-operations">
      <p className="eyebrow">DIVISION DETAILS</p>
      <h2>Uniform Photos</h2>
      <p className="operations-intro">
        Open one season, then one division. Upload one dark and one light reference photo for every
        team in that division.
      </p>
      <div className="uniform-season-list">
        {available.map((season, index) => (
          <details className="operations-season card" key={season.id} open={index === 0}>
            <summary>
              <span>
                <b>{season.name}</b>
                <small>
                  {season.divisions.length} division{season.divisions.length === 1 ? "" : "s"}
                </small>
              </span>
              <strong>›</strong>
            </summary>
            <div className="uniform-settings-list">
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
      <article className="team-leadership-role editing">
        <form action={action} className="team-leadership-picker">
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
    <article className="team-leadership-role">
      <div>
        <small>{role.toUpperCase()}</small>
        <b>{currentName}</b>
      </div>
      <div className="team-leadership-actions">
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
    <section className="team-leadership-editor">
      <h4>Team Leadership</h4>
      <div className="team-leadership-list">
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
    <details className="game-action-card">
      <summary>
        <span className="owner-team-mark">{team.name.slice(0, 2).toUpperCase()}</span>
        <span>
          <b>{team.name}</b>
          <small>
            {players.length} player{players.length === 1 ? "" : "s"}
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <div className="game-form">
        <TeamLeadershipEditor team={team} />
        {players.length ? (
          players.map((player) => <TeamPlayerRow key={player.registrationId} player={player} />)
        ) : (
          <p className="empty-note">No active players yet.</p>
        )}
      </div>
    </details>
  );
}

function TeamPlayerRow({ player }: { player: OwnerRosterPlayer }) {
  const [state, action, pending] = useActionState(returnPlayerToDraftPoolAction, initialState);
  return (
    <details className="roster-player-editor">
      <summary>
        <span>
          <b>{player.name}</b>
          <small>
            #{player.jerseyNumber ?? "—"} · {player.position || "Position not set"} · {player.role}
          </small>
        </span>
        <strong>›</strong>
      </summary>
      <form action={action} className="owner-form">
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
