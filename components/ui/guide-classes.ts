/**
 * The owner's guide: its two-column frame, the sticky index rail and the body.
 *
 * Shared with app/owner/guide/loading.tsx, which is a skeleton the visual suite
 * waits out by definition. Both files import the same strings, which is the
 * only way the unphotographable one is correct by construction rather than by
 * transcription - the same argument as components/ui/RulesDocument.tsx.
 */
export const guideFrame =
  "mt-1 grid gap-[22px] desk:grid-cols-[210px_minmax(0,1fr)] desk:items-start desk:gap-[44px]";
/* Two shapes, kept apart by the breakpoint rather than layered on top of
   each other: a wrapped row of pills on a phone, a sticky rail of flush
   rows against a hairline on a laptop. They used to overlap in one variant
   set, where bg-none only clears a background *image* and left the pills
   white. */
export const guideIndex =
  "gap-[7px] max-desk:flex max-desk:flex-wrap max-desk:[&_a]:rounded-full max-desk:[&_a]:border max-desk:[&_a]:border-line max-desk:[&_a]:bg-[rgba(255,255,255,0.72)] max-desk:[&_a]:p-[7px_12px] max-desk:[&_a]:text-[12.5px] desk:sticky desk:top-5 desk:grid desk:gap-px desk:border-l-2 desk:border-l-line desk:[&_a]:-ml-0.5 desk:[&_a]:border-l-2 desk:[&_a]:border-l-transparent desk:[&_a]:bg-transparent desk:[&_a]:p-[8px_0_8px_14px] desk:[&_a]:text-[13px] desk:[&_a]:leading-[1.3] desk:[&_a:hover]:border-l-gold desk:[&_a:hover]:text-navy! [&_a]:font-[700] [&_a]:text-[#43536a]!";
export const guideBody = "grid gap-[30px] desk:max-w-[760px] desk:gap-[44px]";
