/**
 * The signed-out screens: login, sign-up, reset, and the platform's own login
 * and invitation pages. Seven files draw the same header, column and box.
 */

/** The KADA mark above the form. */
export const loginLogo = "relative z-[2] p-[38px_38px_5px] [&_.kch-logo]:[--kch-logo-size:52px]";
/** The column the form sits in. `signup` trims the top. */
export const loginColumn =
  "relative z-[2] p-[25px_30px_50px] [&_h1]:m-[0_0_15px] [&_h1]:text-[40px] [&_h1]:leading-[1.08]";
export const loginColumnTight = "pt-[10px]";
/** The bordered form itself. */
export const loginBox =
  "mt-[28px] grid gap-3 p-[22px_20px] [&_label]:text-[15px] [&_label]:font-[800]";
export const forgotLink = "text-right text-sm text-blue";
export const loginTagline =
  "text-center leading-[1.7] text-gold [&_b]:text-navy [&_span]:text-gold";

/** A tall single field, used by the owner application and payment forms. */
export const tallField =
  "grid gap-2 [&_input]:min-h-[50px] [&_input]:w-full [&_input]:rounded-[14px] [&_input]:border [&_input]:border-[#d6dbe2] [&_input]:bg-white [&_input]:px-[14px] [&_input]:outline-0 [&_input:focus]:border-blue [&_input:focus]:shadow-[0_0_0_3px_rgba(23,74,165,0.12)]";
export const amountField =
  "grid gap-[6px] [&_input]:w-full [&_input]:rounded-[11px] [&_input]:border [&_input]:border-[#d6dbe2] [&_input]:bg-white [&_input]:p-3";

/** The platform workspace's own small parts. */
export const platformForm =
  "mt-[3px] grid gap-2 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-[#d6dbe2] [&_input]:bg-white [&_input]:p-[10px] [&_input]:font-[inherit] [&_input]:text-xs [&_input]:text-navy";
export const platformNote = "my-4 text-[11px] leading-[1.5] text-muted";
export const platformAttention =
  "mt-2 inline-flex w-max rounded-full bg-[#fff4da] p-[5px_8px] text-[10px] font-[850] text-[#8a5900]";
export const platformCandidate =
  "mt-3 border-t border-line py-[13px] [&>div]:grid [&>div]:gap-[3px] [&_small]:text-[11px] [&_small]:text-muted";
