/**
 * The account rows and disclosures on the profile and "more" pages, and the
 * payment history panel that shares their shape.
 *
 * accountRow is the run the disclosure summary and the plain link both had -
 * one rule with two selectors in globals.css - so it is one string here.
 * accountLink adds what the link needs to look like a card on its own.
 */

export const accountRow =
  "grid min-h-[64px] w-full list-none grid-cols-[36px_1fr_auto] items-center gap-[10px] p-[13px_16px] text-left [&>span]:grid [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-line [&>span]:text-lg [&>span]:text-navy [&>b]:text-[15px] [&>strong]:text-2xl [&>strong]:transition-transform";
export const accountLink =
  "rounded-[20px] border border-line bg-[rgba(255,255,255,0.94)] shadow-[0_8px_20px_rgba(13,38,69,0.08)] [&:is(button)]:cursor-pointer [&:is(button)]:font-[inherit]";
export const accountDisclosure =
  "group overflow-hidden [&>summary]:cursor-pointer [&>summary::-webkit-details-marker]:hidden group-open:[&>summary>strong]:rotate-90";

/** The tile list on both "more" pages. */
export const moreList =
  "mt-[18px] grid gap-[10px] [&>a]:grid [&>a]:min-h-[76px] [&>a]:grid-cols-[46px_minmax(0,1fr)_auto_auto] [&>a]:items-center [&>a]:gap-[11px] [&>a]:rounded-2xl [&>a]:border [&>a]:border-line [&>a]:bg-white [&>a]:p-[13px] [&>a]:shadow-[0_6px_16px_rgba(13,38,69,0.06)] [&>a>span]:grid [&>a>span]:h-[44px] [&>a>span]:w-[44px] [&>a>span]:place-items-center [&>a>span]:rounded-[13px] [&>a>span]:bg-[#f7f0e4] [&>a>span]:text-[22px] [&>a>span]:text-gold [&>a>div]:grid [&>a>div]:gap-1 [&_b]:text-[15px] [&_small]:text-xs [&_small]:leading-[1.35] [&_small]:text-muted [&_em]:grid [&_em]:h-[25px] [&_em]:min-w-[25px] [&_em]:place-items-center [&_em]:rounded-[15px] [&_em]:bg-red [&_em]:px-[7px] [&_em]:text-[10px] [&_em]:font-[900] [&_em]:text-white [&_em]:not-italic [&_strong]:text-[23px]";

/** Payments' own history disclosure, and the platform's copy of it. The two
    disagree about their columns - one has an icon and the other does not - so
    the call site says which, rather than one of them overriding the other at
    the same specificity and letting source order decide. */
export const historyPanel =
  "group mt-[18px] overflow-hidden [&>summary]:grid [&>summary]:min-h-[64px] [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:gap-[10px] [&>summary]:p-[13px_16px] [&>summary::-webkit-details-marker]:hidden [&>summary>span]:text-[23px] [&>summary>span]:text-muted [&>summary>b]:text-base [&>summary>strong]:text-2xl [&>summary>strong]:transition-transform group-open:[&>summary>strong]:rotate-90 [&>h2]:m-[0_0_5px] [&>h2]:text-sm [&>h2]:text-gold";
export const historyRow =
  "grid grid-cols-[36px_1fr_auto] items-center gap-[10px] border-b border-line py-[13px] last:border-b-0 [&>span:first-child]:grid [&>span:first-child]:h-8 [&>span:first-child]:w-8 [&>span:first-child]:place-items-center [&>span:first-child]:rounded-full [&>span:first-child]:bg-[#e8f4e8] [&>span:first-child]:text-green [&>span:nth-child(2)]:grid [&>span:nth-child(2)]:gap-1 [&_b]:text-sm [&_small]:text-xs [&_small]:text-muted [&>strong]:text-base";

/** Am I playing? - the two-way switch and the row it sits in. */
export const availabilityControl =
  "grid grid-cols-[1fr_auto] items-center gap-[10px] [&>span]:grid [&>span_small]:font-[800] [&>span_small]:text-[#b76b00] [&>span_b]:text-sm [&>div]:relative [&>div]:grid [&>div]:grid-cols-2 [&>div]:rounded-xl [&>div]:bg-[#eef1f4] [&>div]:p-1 [&_button]:relative [&_button]:min-w-[64px] [&_button]:rounded-[9px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[9px] [&_button]:font-[900] [&_button]:text-[#5a6675] [&_button]:transition-colors [&_button]:duration-200 [&_button]:ease-in-out [&_button.active]:text-white [&>p]:col-span-full [&>p]:m-0";
/** The sliding pill. Its parent carries data-choice, which is what moves it. */
export const availabilityThumb =
  "absolute top-1 bottom-1 left-1 w-[calc((100%_-_8px)/2)] rounded-[9px] bg-[#258b45] transition-[transform,background-color] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none group-data-[choice=no]:translate-x-full group-data-[choice=no]:bg-[#cf2e2e]";
