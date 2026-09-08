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
export const guideIndex =
  "flex flex-wrap gap-[7px] desk:sticky desk:top-5 desk:grid desk:gap-px desk:border-l-2 desk:border-l-line [&_a]:rounded-full [&_a]:border [&_a]:border-line [&_a]:bg-[rgba(255,255,255,0.72)] [&_a]:p-[7px_12px] [&_a]:text-[12.5px] [&_a]:font-[700] [&_a]:text-[#43536a] desk:[&_a]:-ml-0.5 desk:[&_a]:rounded-none desk:[&_a]:border-0 desk:[&_a]:border-l-2 desk:[&_a]:border-l-transparent desk:[&_a]:bg-none desk:[&_a]:p-[8px_0_8px_14px] desk:[&_a]:text-[13px] desk:[&_a]:leading-[1.3] desk:[&_a:hover]:border-l-gold desk:[&_a:hover]:text-navy";
export const guideBody = "grid gap-[30px] desk:max-w-[760px] desk:gap-[44px]";
