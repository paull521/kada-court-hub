import { LoadingNote, SkeletonBlock, SkeletonText } from "@/components/Skeleton";

/**
 * What /captain/roster draws while its read is in flight.
 *
 * Loading-only, unlike the other frames: the page's body is CaptainDraftRoster,
 * a client component of forms and disclosures that has no meaning without the
 * roster it edits. So this is the panel around it - the heading, the sentence
 * under it and the Team roster subheading, none of which ever needed the read -
 * with a block the height of a player row for each player, because a
 * placeholder should not be a form you can type into.
 */
export default function CaptainRosterFrame() {
  return (
    <section className="card owner-section captain-draft-entry">
      <LoadingNote />
      <div className="owner-section-title">
        <span className="owner-icon">🏀</span>
        <span>
          <h2>Enter Drafted Players</h2>
          <p>
            Add jersey number, position, uniform size, and an optional team-specific jersey name.
          </p>
        </span>
      </div>
      <section className="captain-added-players">
        <div>
          <h3>Team roster</h3>
          <span>
            <SkeletonText width="5em" />
          </span>
        </div>
        <div className="captain-roster-list">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <SkeletonBlock key={index} height="54px" radius="14px" />
          ))}
        </div>
      </section>
    </section>
  );
}
