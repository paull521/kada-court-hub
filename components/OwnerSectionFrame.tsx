import { LoadingNote, SkeletonBlock } from "@/components/Skeleton";
import { frameList } from "@/components/ui/shared-classes";

/**
 * What an owner page draws while its read is in flight.
 *
 * Every owner page under the dashboard is the same shape: a heading and an
 * introduction that are fixed words, then a list of season or division cards
 * that are the read. So the fixed words are drawn immediately - each page
 * passes its own - and only the cards are blocks, at the height of the cards
 * they stand in for.
 *
 * They are blocks rather than card markup because every one of those cards is a
 * disclosure over a form: a placeholder should not be something you can open or
 * type into. The page title and subtitle above this are already real, because
 * OwnerPageShell has always taken them as strings.
 *
 * /owner itself is deliberately not using this - its tiles paint whole and only
 * their counts stream, which is the better thing and already true there.
 */
export default function OwnerSectionFrame({
  eyebrow,
  heading,
  intro,
  rows = 3,
  rowHeight = "68px",
}: {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  rows?: number;
  rowHeight?: string;
}) {
  return (
    <section className="owner-operations owner-page-section">
      <LoadingNote />
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {heading && <h2>{heading}</h2>}
      {intro && <p className="operations-intro">{intro}</p>}
      <div className={frameList}>
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonBlock key={index} height={rowHeight} radius="18px" />
        ))}
      </div>
    </section>
  );
}
