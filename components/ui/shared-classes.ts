/**
 * The last of the runs that more than one component drew.
 *
 * Everything here was in globals.css because two or three files needed it, not
 * because it belonged to any of them. Grouping by what it is rather than by
 * which stylesheet it happened to live in.
 */

/** A form's controls. Six components use it; the labels and inputs are its. */
export const ownerForm =
  "grid gap-3 [&_label]:grid [&_label]:gap-[6px] [&_label]:text-xs [&_label]:font-[800] [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-[11px] [&_input]:border [&_input]:border-[#d6dbe2] [&_input]:bg-white [&_input]:p-[11px] [&_input]:font-[inherit] [&_input]:text-[inherit] [&_select]:w-full [&_select]:min-w-0 [&_select]:rounded-[11px] [&_select]:border [&_select]:border-[#d6dbe2] [&_select]:bg-white [&_select]:p-[11px] [&_select]:font-[inherit] [&_select]:text-[inherit] [&_textarea]:min-h-[100px] [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-[11px] [&_textarea]:border [&_textarea]:border-[#d6dbe2] [&_textarea]:bg-white [&_textarea]:p-[11px] [&_textarea]:font-[inherit] [&_textarea]:text-[inherit] [&_.check-row]:flex [&_.check-row]:items-center [&_.check-row]:font-[600] [&_.check-row_input]:h-[17px] [&_.check-row_input]:w-[17px]";

/** A heading with a rule under it, above a block of owner or captain work. */
export const sectionTitle =
  "mb-4 flex items-center gap-3 border-b border-line pb-[14px] [&_h2]:m-0 [&_h2]:text-[19px] [&_p]:m-[4px_0_0] [&_p]:text-xs [&_p]:text-muted";

/** One player on a roster. Two shapes agree on everything but their columns. */
/* text-[14px] rather than text-sm: the named size carries a line-height the
   original rule did not set, which is five pixels a row on a ten-row list. */
export const rosterRow =
  "grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-line py-2 text-[14px] last:border-0 [&>span]:text-blue [&_.staff-role]:text-gold";

/** The light/dark swatch beside a uniform. */
export const uniformDot = "inline-block h-[18px] w-[18px] rounded-full border border-navy bg-white";
export const uniformDotDark = "bg-navy!";

/** Profile's header card and the label/value rows under it. */
export const profileCard =
  "mb-[14px] grid grid-cols-[90px_1fr] items-center gap-[15px] p-[18px] [&_h2]:m-0 [&_h2]:text-[27px] [&_p]:my-[6px] [&_p]:text-xs [&_p]:text-muted";
export const infoRow =
  "grid grid-cols-[30px_1fr_auto] items-center gap-2 border-b border-line py-[9px] text-xs last:border-0 [&>span]:grid [&>span]:h-[27px] [&>span]:w-[27px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-line [&_em]:text-right [&_em]:text-muted [&_em]:not-italic";

/** Three empty states that differ only in how much air they take. */
export const emptyFeature =
  "mb-4 grid min-h-[150px] grid-cols-[58px_1fr] items-center gap-4 p-[25px] [&>span]:text-[42px] [&>span]:text-gold [&_h2]:m-[0_0_6px] [&_h2]:text-[21px] [&_p:last-child]:m-0 [&_p:last-child]:text-sm [&_p:last-child]:leading-[1.5] [&_p:last-child]:text-muted";
export const seasonEmpty =
  "p-[30px_18px] text-center [&>span]:text-[38px] [&>span]:text-gold [&_h2]:m-[10px_0_5px] [&_h2]:text-xl [&_p]:m-0 [&_p]:text-sm [&_p]:leading-[1.5] [&_p]:text-muted";
export const emptyOperation =
  "grid grid-cols-[46px_1fr] items-center gap-3 p-4 [&>span]:grid [&>span]:h-[42px] [&>span]:w-[42px] [&>span]:place-items-center [&>span]:rounded-[13px] [&>span]:bg-[#f7f0e4] [&>span]:text-[21px] [&>span]:text-gold [&_h3]:m-[0_0_4px] [&_h3]:text-[17px] [&_p]:m-0 [&_p]:text-sm [&_p]:text-muted";

/** The card the invite and join flows land on. */
export const joinCard =
  "mt-[70px] grid gap-[13px] p-[28px_20px] text-center [&>span]:text-[42px] [&_h1]:m-0 [&_h1]:text-[27px] [&_p]:m-0 [&_p]:text-sm [&_p]:leading-[1.5] [&_p]:text-muted [&_.btn]:block";

/** A captain's just-added players, and the uniform gallery's controls. */
export const addedPlayers =
  "grid gap-2 rounded-[13px] border border-line bg-[#fafafa] p-3 [&>div:first-child]:flex [&>div:first-child]:items-baseline [&>div:first-child]:justify-between [&>div:first-child]:gap-[10px] [&_h3]:m-0 [&_h3]:text-[13px] [&_span]:text-[10px] [&_span]:text-muted";
export const uniformToggle =
  "grid grid-cols-2 gap-[7px] rounded-[13px] bg-[#f0efed] p-1 [&_button]:min-h-[44px] [&_button]:rounded-[10px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-sm [&_button]:font-[800] [&_button.active]:bg-navy [&_button.active]:text-white [&_button.active]:shadow-[0_3px_8px_rgba(7,31,61,0.16)] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:text-[#a1a5aa]";
export const uniformGalleryLabels =
  "grid gap-[7px] [&>span]:flex [&>span]:items-center [&>span]:justify-between [&>span]:gap-[9px] [&>span]:border-t [&>span]:border-line [&>span]:pt-[7px] [&_small]:text-[11px] [&_small]:font-[750] [&_small]:text-muted [&_b]:text-right [&_b]:text-[13px]";

/** A submitted payment awaiting the owner, and the KADA sign-off line. */
export const paymentStatusCard =
  "mb-[9px] grid min-h-[68px] grid-cols-[42px_1fr] items-center gap-[10px] rounded-[15px] border border-[#e8c98f] bg-[#fffbf3] p-[13px_15px] [&>span]:grid [&>span]:h-[38px] [&>span]:w-[38px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#fff0d5] [&>span]:text-gold [&>div]:grid [&>div]:gap-1 [&_b]:text-[15px]";
/* The two desk: rules were ancestor-scoped in desktop.css - one to span both
   panes of a two-column page, one to close the page with a rule above it. The
   banner is the last child of .content on every page that has it, so it can
   say both itself. */
export const familyBanner =
  "p-[22px_12px_6px] text-center text-muted [&_span]:text-red desk:col-span-full desk:mt-[34px] desk:border-t desk:border-line desk:pt-[22px]";

/** The rules acknowledgement form at the foot of a rules document. */
export const rulesAcknowledgment =
  "grid gap-[13px] border-t border-line p-[18px] [&>p]:m-0 [&>p]:text-[13px] [&>p]:leading-[1.55] [&>p]:text-muted [&_.check-row]:items-start [&_.check-row]:leading-[1.45] [&_.check-row_input]:mt-[3px] [&_.btn:disabled]:cursor-not-allowed [&_.btn:disabled]:opacity-[0.48]";
