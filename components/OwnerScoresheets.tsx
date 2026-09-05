"use client";

import { ChevronRight } from "lucide-react";
import { useActionState, useState } from "react";
import {
  finalizeGameScoreAction,
  saveGameScoreDraftAction,
  type OwnerActionState,
} from "@/app/owner/actions";
import type { OwnerDivision, OwnerSeason } from "@/lib/owner-data";

const initialState: OwnerActionState = {};
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
const gameMeta = (game: OwnerSeason["games"][number]) =>
  `${dateLabel(game.localStartsAt)} · ${game.venue} · ${game.court || "Court TBD"}`;

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
      <article className="scoreboard-card">
        <div className="scoreboard-match">
          <div>
            <b>{game.homeTeam}</b>
            <strong>{game.homeScore}</strong>
          </div>
          <i>–</i>
          <div>
            <b>{game.awayTeam}</b>
            <strong>{game.awayScore}</strong>
          </div>
        </div>
        <small className="scoreboard-meta">{gameMeta(game)}</small>
      </article>
    );
  return (
    <article className="scoreboard-card">
      <div className="scoreboard-entry">
        <form action={saveAction}>
          <input type="hidden" name="gameId" value={game.id} />
          <div className="score-entry-fields">
            <label>
              <span>{game.homeTeam}</span>
              <input
                name="homeScore"
                type="number"
                min="0"
                value={home}
                onChange={(event) => setHome(event.target.value)}
                required
              />
            </label>
            <strong>–</strong>
            <label>
              <span>{game.awayTeam}</span>
              <input
                name="awayScore"
                type="number"
                min="0"
                value={away}
                onChange={(event) => setAway(event.target.value)}
                required
              />
            </label>
          </div>
          <button className="btn secondary" disabled={saving || finalizing}>
            {saving ? "Saving…" : "Save Draft"}
          </button>
        </form>
        <form action={finalAction}>
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="homeScore" value={home} />
          <input type="hidden" name="awayScore" value={away} />
          <button className="btn primary" disabled={!home || !away || saving || finalizing}>
            {finalizing ? "Finalizing…" : "Final Score"}
          </button>
        </form>
      </div>
      {saveState.error && <p className="form-error">{saveState.error}</p>}
      {saveState.message && <p className="form-success">{saveState.message}</p>}
      {finalState.error && <p className="form-error">{finalState.error}</p>}
      <small className="scoreboard-meta">{gameMeta(game)}</small>
    </article>
  );
}

function DivisionScores({ season, division }: { season: OwnerSeason; division: OwnerDivision }) {
  const games = season.games.filter(
    (game) => game.divisionId === division.id && game.status === "scheduled",
  );
  if (!games.length) return null;
  return (
    <details className="scoresheet-division" open>
      <summary>
        <span>
          <b>{division.name}</b>
          <small>
            {games.filter((game) => game.finalized).length} of {games.length} results posted
          </small>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="scoreboard-list">
        {games.some((game) => !game.finalized) && (
          <p className="score-reminder">
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
      <section className="card">
        <h3>No scoresheets yet</h3>
      </section>
    );
  return (
    <div className="scoresheet-season-list">
      {available.map((season, index) => (
        <details className="scoresheet-season card" key={season.id} open={index === 0}>
          <summary>
            <span>
              <b>{season.name}</b>
              <small>
                {season.divisions.length} division{season.divisions.length === 1 ? "" : "s"}
              </small>
            </span>
            <strong aria-hidden="true">
              <ChevronRight className="go-caret" />
            </strong>
          </summary>
          <div>
            {season.divisions.map((division) => (
              <DivisionScores season={season} division={division} key={division.id} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
