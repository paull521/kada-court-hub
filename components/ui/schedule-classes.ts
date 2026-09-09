/**
 * Utility runs shared by the schedule and team frames.
 *
 * These were the last of the multi-file class names in globals.css: five
 * components drew the same week card, the same compact game row and the same
 * empty state, and the stylesheet was the only thing keeping them agreeing.
 * A module of strings keeps that agreement where a reader can see it, and it
 * still deletes with the last component that imports it.
 */

/** The white week card, and the header bar across its top. */
export const scheduleWeek =
  "group overflow-hidden rounded-[15px] border border-line bg-white [&>summary]:m-0 [&>summary]:grid [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:grid-cols-[1fr_auto_20px] [&>summary]:items-center [&>summary]:gap-[10px] [&>summary]:bg-[#f8f5f0] [&>summary]:p-[12px_14px] [&>summary::-webkit-details-marker]:hidden [&>summary_span]:text-[15px] [&>summary_span]:font-[800] [&>summary_span]:text-navy [&>summary_small]:text-xs [&>summary_small]:text-muted [&>summary_strong]:text-[21px] [&>summary_strong]:transition-transform group-open:[&>summary_strong]:rotate-90";
/** The same bar before the weeks are known: a plain div, nothing to open. */
export const scheduleWeekFrame =
  "grid grid-cols-[1fr_auto] items-center gap-[10px] bg-[#f8f5f0] p-[12px_14px]";

/** The wide fixtures table, which scrolls sideways rather than wrapping. */
export const scheduleTableScroll =
  "overflow-x-auto [-webkit-overflow-scrolling:touch] [&_table]:w-full [&_table]:min-w-[850px] [&_table]:border-collapse [&_table]:text-left [&_th]:border-b [&_th]:border-line [&_th]:bg-[#fffaf2] [&_th]:p-[10px_11px] [&_th]:text-[11px] [&_th]:tracking-[0.04em] [&_th]:whitespace-nowrap [&_th]:text-muted [&_th]:uppercase [&_td]:border-b [&_td]:border-line [&_td]:p-[11px] [&_td]:align-top [&_td]:text-[13px] [&_td]:leading-[1.35] [&_td]:whitespace-nowrap [&_tr:last-child_td]:border-b-0 [&_td:nth-child(5)]:min-w-[165px] [&_td:nth-child(5)]:whitespace-normal [&_td:nth-child(6)]:min-w-[165px] [&_td:nth-child(6)]:whitespace-normal [&_td_span]:mt-[2px] [&_td_span]:block [&_td_span]:text-muted";

/** The section around a week list, and the list itself. */
export const weeklySchedule =
  "mb-[18px] [&>header]:flex [&>header]:items-end [&>header]:justify-between [&>header]:gap-[14px] [&>header]:p-[4px_2px_14px] [&>header_small]:text-[11px] [&>header_small]:font-[900] [&>header_small]:tracking-[0.08em] [&>header_small]:text-gold [&>header_h3]:m-[3px_0] [&>header_h3]:text-[21px] [&>header_p]:m-0 [&>header_p]:text-[13px] [&>header_p]:text-muted";
export const weeklyScheduleList = "grid gap-3";

/** "Nothing scheduled yet" and its siblings, on five frames. */
export const scheduleEmpty =
  "mb-[18px] p-[30px_20px] text-center [&>span]:text-[42px] [&>span]:text-gold [&_h2]:mt-[10px] [&_h2]:mb-[6px] [&_h2]:text-[21px] [&_p]:m-0 [&_p]:text-sm [&_p]:leading-[1.5] [&_p]:text-muted";

/**
 * One game, drawn small: date on the left, teams in the middle, time and
 * uniform at the end. The row names its areas so compactGameSide can sit in
 * the last one without the middle column having to know how wide it is.
 */
export const compactGame =
  "grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-[10px] p-3 [grid-template-areas:'date_matchup_side'] max-tiny:grid-cols-[42px_minmax(0,1fr)_auto] max-tiny:gap-[7px] max-tiny:p-[10px] [&>time]:[grid-area:date] [&>time]:grid [&>time]:min-h-[64px] [&>time]:content-center [&>time]:justify-items-center [&>time]:gap-px [&>time]:border-r [&>time]:border-line [&>time]:pr-2 [&>time]:text-center [&>time]:text-[9px] [&>time]:leading-[1.1] [&>time_b]:text-[10px] [&>time_strong]:text-[23px] [&>time_strong]:leading-none";

/** The middle column, and the end one. */
export const compactGameMain =
  "[grid-area:matchup] grid min-w-0 gap-[5px] text-center [&_strong]:text-[13px] [&_strong]:leading-[1.2] [&_strong]:[overflow-wrap:anywhere] [&_strong]:max-tiny:text-xs [&_strong_span]:text-[10px] [&_strong_span]:text-gold [&_strong_span]:uppercase [&_small]:truncate [&_small]:text-[10px] [&_small]:leading-[1.25] [&_small]:text-muted";
export const compactGameSide =
  "[grid-area:side] grid content-center justify-items-end gap-2 whitespace-nowrap [&>strong]:text-base [&>strong]:leading-none [&>strong]:max-tiny:text-[15px] [&>span]:flex [&>span]:items-center [&>span]:justify-end [&>span]:gap-1 [&>span]:text-[9px] [&>span]:font-[850] [&>span]:text-navy [&_small]:text-[8px] [&_small]:font-[850] [&_small]:text-gold [&_small]:max-tiny:hidden [&_.uniform-dot]:h-3 [&_.uniform-dot]:w-3 [&_.uniform-dot]:flex-none";

/** The two pills on the fixtures table. */
export const gamePhase =
  "inline-flex w-max rounded-full p-[5px_8px] text-[9px] font-[900] tracking-[0.04em] not-italic";
export const gamePhaseTone = (phase: string) =>
  phase === "playoff" ? "bg-[#fff4da] text-[#8a5900]" : "bg-[#eef1f4] text-[#536170]";
export const scheduleStatus =
  "inline-block rounded-full p-[4px_8px] text-[10px] font-[900] uppercase not-italic";
export const scheduleStatusTone = (status: string) =>
  status === "postponed" || status === "canceled"
    ? "bg-[#ffe7e7] text-[#981b1f]"
    : "bg-[#e8f3e8] text-[#17632c]";

/** The navy team header, and the copy inside it. */
export const teamBanner =
  "m-0 grid w-full grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-[14px] border-[rgba(7,31,61,0.22)]! bg-[linear-gradient(125deg,#08243e,#0a3767)]! p-[13px_16px] text-left text-white! disabled:cursor-default [&_.team-mark]:m-0! [&_.skeleton]:bg-[linear-gradient(90deg,#061b2f_25%,#0d3055_37%,#061b2f_63%)]! [&_.skeleton]:bg-[length:400%_100%]!";
export const teamBannerCopy =
  "grid min-w-0 gap-[3px] [&_b]:truncate [&_b]:text-[21px] [&_b]:tracking-[-0.3px] [&_small]:text-[13px] [&_small]:text-[#d8e0e8]";

/* The player's weekly view only. It sits directly in .content, where it needs
   the space that separates two sections; the captain's is inside a column of
   its own and the old rule - .content > .player-weekly-schedule - never
   reached it. */
export const weeklyScheduleLead =
  "desk:mt-[30px] desk:[&>header_h2]:my-[3px] desk:[&>header_h2]:text-[21px]";
