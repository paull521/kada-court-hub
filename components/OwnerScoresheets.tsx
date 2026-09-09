"use client";

import { ChevronRight } from "lucide-react";
import { useActionState, useState } from "react";
import {
  finalizeGameScoreAction,
  saveGameScoreDraftAction,
  type OwnerActionState,
} from "@/app/owner/actions";
import type { OwnerDivision, OwnerSeason } from "@/lib/owner-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { cx } from "@/components/ui/cx";

const initialState: OwnerActionState = {};
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
const gameMeta = (game: OwnerSeason["games"][number]) =>
  `${dateLabel(game.localStartsAt)} · ${game.venue} · ${game.court || "Court TBD"}`;

/** Hides the disclosure triangle and lets the row own its layout. */
const summaryReset = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";
/** Both disclosure headers: title and subtitle on the left, chevron on the right. */
const summaryRow = "grid grid-cols-[1fr_auto] items-center gap-[10px]";

/**
 * The navy gradient panel a game sits in.
 *
 * Deliberately not the Card primitive. .card is unlayered CSS, so it would
 * outrank a utility gradient no matter what this wrote - which is exactly why
 * the old rule carried `background: ... !important; border: 0 !important`.
 * Not asking for .card in the first place removes the fight instead of winning it.
 */
const panel =
  "min-w-0 overflow-hidden rounded-[17px] border-0 bg-[linear-gradient(135deg,#061f3d,#125188)] p-[15px] text-white max-tiny:p-[13px]";

/** The line of venue and time under a game. */
const meta =
  "mt-[13px] block border-t border-white/[0.22] px-[16px] pt-[10px] pb-[6px] text-center text-[11px] text-[#dbe8f3]";

/**
 * The two score inputs either side of a dash.
 *
 * `text-navy!` is not decoration. globals.css styles `button, input` with
 * `color: inherit`, unlayered - and unlayered rules beat layered ones whatever
 * their specificity - so a plain text-navy would lose and the figures would
 * inherit the panel's white. The old rule needed `!important` for the same
 * reason.
 */
const scoreInput =
  "box-border min-h-[58px] w-full rounded-[13px] bg-white text-center text-[24px] font-[850] text-navy! [-webkit-text-fill-color:var(--navy)] [caret-color:var(--navy)] placeholder:text-[#6e7885] placeholder:opacity-100 max-tiny:min-h-[52px] max-tiny:text-[22px]";
const scoreLabel =
  "mb-[2px] block min-h-0 text-center text-[11px] leading-[1.3] font-[800] text-[#e2edf6] [overflow-wrap:anywhere]";

function Game({ game }: { game: OwnerSeason["games"][number] }) {
  const [saveState, saveAction, saving] = useActionState(saveGameScoreDraftAction, initialState);
  const [finalState, finalAction, finalizing] = useActionState(
    finalizeGameScoreAction,
    initialState,
  );
  const [home, setHome] = useState(game.draftHomeScore?.toString() ?? "");
  const [away, setAway] = useState(game.draftAwayScore?.toString() ?? "");

  if (game.finalized)
    return (
      <article className={panel} data-finalized="true">
        <div className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-[8px] p-[6px_0_13px] text-center">
          <div className="grid min-w-0 gap-[8px]">
            <b className="text-[13px] leading-[1.2] [overflow-wrap:anywhere] max-tiny:text-[12px]">
              {game.homeTeam}
            </b>
            <strong className="text-[42px] leading-none max-tiny:text-[36px]">
              {game.homeScore}
            </strong>
          </div>
          <i className="text-[24px] not-italic text-[#f6bb43]">–</i>
          <div className="grid min-w-0 gap-[8px]">
            <b className="text-[13px] leading-[1.2] [overflow-wrap:anywhere] max-tiny:text-[12px]">
              {game.awayTeam}
            </b>
            <strong className="text-[42px] leading-none max-tiny:text-[36px]">
              {game.awayScore}
            </strong>
          </div>
        </div>
        <small className={meta}>{gameMeta(game)}</small>
      </article>
    );

  return (
    <article className={panel}>
      <div className="grid min-w-0 gap-[10px]">
        <form action={saveAction} className="grid min-w-0 gap-[10px]">
          <input type="hidden" name="gameId" value={game.id} />
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-end gap-[8px] pb-[2px]">
            <label className="min-w-0">
              <span className={scoreLabel}>{game.homeTeam}</span>
              <input
                name="homeScore"
                type="number"
                min="0"
                value={home}
                onChange={(event) => setHome(event.target.value)}
                required
                className={scoreInput}
              />
            </label>
            <strong className="pb-[12px] text-center text-[22px]">–</strong>
            <label className="min-w-0">
              <span className={scoreLabel}>{game.awayTeam}</span>
              <input
                name="awayScore"
                type="number"
                min="0"
                value={away}
                onChange={(event) => setAway(event.target.value)}
                required
                className={scoreInput}
              />
            </label>
          </div>
          <Button
            variant="secondary"
            disabled={saving || finalizing}
            className="border-white/[0.42]! bg-white/[0.14]! text-white!"
          >
            {saving ? "Saving…" : "Save Draft"}
          </Button>
        </form>
        <form action={finalAction} className="grid min-w-0 gap-[10px]">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="homeScore" value={home} />
          <input type="hidden" name="awayScore" value={away} />
          <Button disabled={!home || !away || saving || finalizing}>
            {finalizing ? "Finalizing…" : "Final Score"}
          </Button>
        </form>
      </div>
      {/* .form-success sets its own background unlayered, so the lighter tone
          this panel needs has to be forced past it. */}
      {saveState.error && <FormMessage tone="error">{saveState.error}</FormMessage>}
      {saveState.message && (
        <FormMessage tone="success" className="bg-[rgba(222,247,229,0.96)]!">
          {saveState.message}
        </FormMessage>
      )}
      {finalState.error && <FormMessage tone="error">{finalState.error}</FormMessage>}
      <small className={meta}>{gameMeta(game)}</small>
    </article>
  );
}

function DivisionScores({ season, division }: { season: OwnerSeason; division: OwnerDivision }) {
  const games = season.games.filter(
    (game) => game.divisionId === division.id && game.status === "scheduled",
  );
  if (!games.length) return null;
  return (
    <details className="group overflow-hidden rounded-[15px] border border-line bg-white" open>
      <summary className={cx(summaryReset, summaryRow, "min-h-[68px] p-[13px_15px]")}>
        <span className="grid gap-[4px]">
          <b className="text-[16px]">{division.name}</b>
          <small className="text-[11px] text-muted">
            {games.filter((game) => game.finalized).length} of {games.length} results posted
          </small>
        </span>
        <strong aria-hidden="true" className="text-[22px] group-open:rotate-90">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="grid gap-[12px] border-t border-line p-[12px] desk:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] desk:gap-[14px]">
        {games.some((game) => !game.finalized) && (
          <p className="m-0 rounded-xl bg-[#fff2c9] p-[12px] text-[12px] leading-[1.45] text-[#795009] desk:col-span-full">
            <b>Reminder:</b> Add scores once each game is completed. Save Draft keeps the score
            until you choose Final Score.
          </p>
        )}
        {games.map((game) => (
          <Game game={game} key={game.id} />
        ))}
      </div>
    </details>
  );
}

export default function OwnerScoresheets({ seasons }: { seasons: OwnerSeason[] }) {
  const available = seasons.filter(
    (season) => !season.canceledAt && season.setupStage >= 7 && season.games.length,
  );
  if (!available.length)
    return (
      <Card>
        <h3>No scoresheets yet</h3>
      </Card>
    );
  return (
    <div className="mt-[20px] grid gap-[11px]">
      {available.map((season, index) => (
        <Card
          as="details"
          className="group/season overflow-hidden"
          key={season.id}
          open={index === 0}
        >
          <summary className={cx(summaryReset, summaryRow, "p-4")}>
            <span className="grid gap-[4px]">
              <b className="text-[17px]">{season.name}</b>
              <small className="text-[12px] text-muted">
                {season.divisions.length} division{season.divisions.length === 1 ? "" : "s"}
              </small>
            </span>
            <strong
              aria-hidden="true"
              className="text-[23px] transition-transform group-open/season:rotate-90"
            >
              <ChevronRight className="go-caret" />
            </strong>
          </summary>
          <div className="grid gap-[9px] border-t border-line p-[11px]">
            {season.divisions.map((division) => (
              <DivisionScores season={season} division={division} key={division.id} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
