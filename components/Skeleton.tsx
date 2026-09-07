/**
 * Placeholder blocks used by route-level loading.tsx files and by the in-page
 * <Suspense> boundaries that stream slow sections. Purely presentational and
 * aria-hidden: the surrounding loading.tsx or OwnerContentPlaceholder carries
 * the live-region label.
 */
export function SkeletonTitle() {
  return <span className="skeleton skeleton-title" aria-hidden="true" />;
}

export function SkeletonChip() {
  return <span className="skeleton skeleton-chip" aria-hidden="true" />;
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="skeleton skeleton-card" aria-hidden="true" />
      ))}
    </>
  );
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="skeleton skeleton-row" aria-hidden="true" />
      ))}
    </>
  );
}

/**
 * Announces a wait to a screen reader. Absolutely positioned by .sr-only, so it
 * is not laid out and can sit inside a grid without taking a cell of it.
 */
export function LoadingNote() {
  return (
    <span className="sr-only" role="status" aria-live="polite">
      Loading
    </span>
  );
}

/**
 * A value that has not arrived yet, standing in the line of real text around
 * it. Sized in em, so it is the height of whatever it is replacing and sits
 * where that text will sit - which is the point of it: the card, its heading
 * and its labels are already on screen, and only the value is missing.
 *
 * The unit invites one mistake, so it is worth saying: 1em is the font size,
 * not a character, and a character averages about half of it. A bar for
 * "8:00 PM" is near 3.8em, not 7em - and at 34px that difference is the width
 * of the whole column it sits in. Size each bar against the string it replaces
 * and the space that string gets. max-width holds the floor if it is still too
 * wide, because an em length has nothing to wrap at and would otherwise run
 * out of its column and over whatever is beside it.
 *
 * The same em also keeps bars for the same value consistent across pages, which
 * is the reason to reach for the number that is already in use rather than a
 * fresh guess. em scales with the font, so one value gives a bar that is the
 * same size relative to its text everywhere it appears - a team name is 7.5em
 * on a line of its own, at 21px in the team banner and at 22px in the Home row
 * alike. It had drifted to 8em and 9em in those two places and to 8em on the
 * Payments balance card, where the column is 92px and 8em of a 12px font is
 * 96px, so the bar filled the card while the same name on Home and Schedule was
 * half that.
 *
 * Where a name wraps inside a narrow centred column under a badge - the matchup
 * on the next-game card, the badge on the balance card - the bar stands for one
 * line rather than the whole string, and that is 4.5em in both.
 */
export function SkeletonText({ width = "7em" }: { width?: string }) {
  return <span className="skeleton skeleton-text" style={{ width }} aria-hidden="true" />;
}

/**
 * The space a control takes while it is still on its way - a toggle, a form, a
 * disclosure. Sized by the caller, because the point is to hold the shape of
 * the particular thing that is coming.
 */
export function SkeletonBlock({
  width = "100%",
  height = "44px",
  radius = "14px",
}: {
  width?: string;
  height?: string;
  radius?: string;
}) {
  return (
    <span className="skeleton" style={{ width, height, borderRadius: radius }} aria-hidden="true" />
  );
}

/**
 * The body of an owner page while its data is still in flight.
 *
 * Shared by app/owner/loading.tsx and by the <Suspense> boundary each owner
 * page wraps its content in, so the two loading phases look the same and the
 * screen does not reshuffle between them: the route skeleton covers the short
 * wait for the conference header, and this same block stays in place under the
 * real header while the heavy read finishes.
 */
export function OwnerContentPlaceholder() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <SkeletonCard count={2} />
      <SkeletonRow count={4} />
    </div>
  );
}
