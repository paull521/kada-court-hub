/**
 * The context switcher: the pill in the top bar, the sheet it opens, and the
 * rows inside it.
 *
 * Four components draw this - the player's team switcher, the captain's, the
 * owner's conference switcher and the notification centre - and none of them
 * is reachable by the visual suite, which never presses anything. So these are
 * transcribed, and the names that stay are the ones something else still needs:
 * context-sheet keeps its class for the z-index and the open-overlay rule that
 * the body sets on itself, and context-option-mark keeps its because the
 * selected row recolours it from the row.
 */

export const contextTrigger =
  "grid max-w-[174px] min-w-0 grid-cols-[minmax(0,1fr)_16px] items-center gap-[6px] rounded-[9px] border border-[rgba(7,31,61,0.11)] bg-[rgba(255,255,255,0.82)] p-[9px_11px] text-left shadow-[0_5px_14px_rgba(13,38,69,0.06)] max-tiny:max-w-[137px] max-tiny:px-[7px] [&>span]:grid [&>span]:min-w-0 [&_b]:truncate [&_b]:text-[11px] [&_.context-switcher-caret]:block [&_.context-switcher-caret]:h-4 [&_.context-switcher-caret]:w-4 [&_.context-switcher-caret]:text-[rgba(7,31,61,0.45)]";

/** Sized and shadowed here; the class it keeps carries only z-index. */
export const contextSheet =
  "context-sheet max-h-[min(78vh,620px)] w-[min(100%,456px)] overflow-auto rounded-[24px_24px_17px_17px] bg-[#fffdf9] p-[10px_18px_20px] shadow-[0_-14px_50px_rgba(4,18,35,0.25)] [animation:context-sheet-in_0.18s_ease-out] desk:rounded-[18px] desk:shadow-[0_24px_60px_rgba(4,18,35,0.28)] desk:[animation:none] [&_header]:flex [&_header]:items-start [&_header]:justify-between [&_header]:gap-3 [&_header_span]:grid [&_header_span]:gap-[3px] [&_header_small]:text-[9px] [&_header_small]:font-[900] [&_header_small]:tracking-[0.8px] [&_header_small]:text-gold [&_h2]:m-0 [&_h2]:text-[22px] [&_h2]:leading-[1.15] [&_header_button]:h-[34px] [&_header_button]:w-[34px] [&_header_button]:rounded-full [&_header_button]:border [&_header_button]:border-line [&_header_button]:bg-white [&_header_button]:text-[23px] [&_header_button]:leading-none";

export const contextOption =
  "grid w-full grid-cols-[39px_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[15px] border border-line bg-white p-[11px] text-left disabled:cursor-wait disabled:opacity-65 [&>span:nth-child(2)]:grid [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:gap-[2px] [&_b]:text-sm [&_small]:text-[10px] [&_small]:text-gold [&_em]:text-[10px] [&_em]:text-muted [&_em]:not-italic [&_strong]:text-[9px] [&_strong]:text-green";
export const contextOptionSelected =
  "border-[#e0a43f]! bg-[#fffbf3]! shadow-[0_5px_14px_rgba(209,132,8,0.08)] [&_.context-option-mark]:bg-[#e8f4e8] [&_.context-option-mark]:text-green";
export const contextOptionMark =
  "context-option-mark grid h-[38px] w-[38px] place-items-center rounded-xl bg-navy font-[900] text-[#f5a313]";
