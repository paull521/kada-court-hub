import { expect, type Page } from "@playwright/test";
import { settle } from "./settle";

/**
 * Every <a> and <button> that asks for a text colour and does not get it.
 *
 * globals.css keeps `a { color: inherit }` and `button { color: inherit }` in
 * its unlayered base layer, and **a layered utility loses to an unlayered rule
 * whatever its specificity**. So a `text-white` written on a link or a button
 * is silently discarded unless it shouts with Tailwind's `!`.
 *
 * That shipped seven times over: the role switcher's selected role, the season
 * tabs, Yes / No, the owner's dark dashboard tiles, the captain's, the team
 * banner and the notification bell all read body navy on a navy ground. Every
 * one passed the screenshots, because the baselines had been re-taken against
 * the broken rendering.
 *
 * A pixel diff cannot see this once a baseline is wrong. Reading the computed
 * colour can: an element that asked for a colour and matches its parent's got
 * nothing.
 */
export async function expectNoLostTextColours(page: Page, paths: string[]) {
  const lost = new Map<string, string>();
  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    if ((response?.status() ?? 500) >= 400) continue;
    await settle(page);
    // Anything inside a shut disclosure is invisible to this too.
    for (let pass = 0; pass < 3; pass++)
      await page
        .locator("details")
        .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
    const hits: [string, string][] = await page.evaluate(() =>
      [...document.querySelectorAll("a,button")].flatMap((el) => {
        const asks = [...(el as HTMLElement).classList].filter(
          (c) => /^text-(white|navy|gold|green|red|blue|muted|\[#)/.test(c) && !c.endsWith("!"),
        );
        if (!asks.length || !el.parentElement) return [];
        const mine = getComputedStyle(el).color;
        return mine === getComputedStyle(el.parentElement).color
          ? ([[asks.join(" "), (el.textContent ?? "").trim().slice(0, 40)]] as [string, string][])
          : [];
      }),
    );
    for (const [cls, text] of hits) if (!lost.has(cls)) lost.set(cls, `${path} — "${text}"`);
  }
  expect(
    [...lost].map(([cls, where]) => `${cls}  ${where}`),
    "text colours on <a>/<button> that lost to the unlayered base rules; add Tailwind's !",
  ).toEqual([]);
}
