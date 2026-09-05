---
name: KadaCourtHub
description: A neighborhood basketball league, run from your phone at the gym.
colors:
  flag-navy: "#071f3d"
  flag-navy-lifted: "#0b315c"
  court-blue: "#174aa5"
  sun-gold: "#d18408"
  sun-gold-bright: "#f4a31b"
  flag-scarlet: "#d11f26"
  available-green: "#188536"
  paper-white: "#fffdf9"
  paper-cream: "#fbf8f3"
  page-ground: "#e9e5df"
  ink-muted: "#5d697a"
  hairline: "#e5e1dc"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "37px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-1.1px"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.2px"
rounded:
  control: "9px"
  chip: "12px"
  action: "13px"
  card: "20px"
  crest: "18px 18px 45% 45%"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.flag-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.action}"
    padding: "15px"
    typography: "{typography.label}"
  card:
    backgroundColor: "rgba(255, 255, 255, 0.94)"
    textColor: "{colors.flag-navy}"
    rounded: "{rounded.card}"
    padding: "18px"
  card-feature:
    backgroundColor: "{colors.flag-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "22px"
  team-crest:
    backgroundColor: "{colors.flag-navy}"
    textColor: "{colors.sun-gold-bright}"
    rounded: "{rounded.crest}"
    size: "68px"
  nav-tab:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "13px 16px 12px"
  nav-tab-active:
    textColor: "{colors.flag-navy}"
  availability-yes:
    backgroundColor: "{colors.available-green}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "9px"
---

# Design System: KadaCourtHub

## Overview

**Creative North Star: "The Barangay Court"**

A barangay is the neighborhood — the smallest unit of belonging in the
Philippines, and the one people actually mean when they say where they are from.
KCH is that, with a hardwood floor. It is not a sports platform that happens to
serve a Filipino-American league; it is a neighborhood's league that happens to
have software. The palette is the Philippine flag, the sign-off is "One Team.
One Court. One Family.", and the warm paper ground is a community board rather
than a product surface.

That heritage is load-bearing, not decorative. Royal blue, scarlet, and the
golden sun are the flag's own colors, and they appear here for the same reason a
jersey carries them. Future work may restyle almost anything in this system, but
swapping these hues for arbitrary brand colors would remove the only thing that
makes the product feel like it belongs to the people using it.

The register is warm and unhurried. A player opens KCH standing in a gym,
answers one question, and leaves; the interface should feel like it was made by
someone in the league rather than sold to it. **The confirmed anti-reference is
enterprise sports software** — the institutional grey of TeamSnap or
SportsEngine, feature-dense and committee-designed, with no point of view.
Whatever KCH becomes, it should never be mistaken for that.

**Key Characteristics:**

- Warm paper ground, never a grey chrome shell
- Philippine flag palette used as identity, not as accent decoration
- Jersey-crest geometry as the recurring signature form
- Generous touch targets and legible type, driven by a 40 Over player base
- Gold reserved for orientation labels; scarlet reserved for attention
- Phone is the real usage scene; the laptop layout is an accommodation, not the target

## Colors

The palette is the Philippine flag rendered on warm paper: a deep royal navy
doing nearly all the work, a golden sun for orientation, and scarlet held in
reserve.

### Primary

- **Flag Navy** (`#071f3d`): The system's ink and its heaviest surface. Body
  text, headings, the primary action, and the full background of the Next Game
  hero. When something must be read or must be pressed, it is this color.
- **Flag Navy Lifted** (`#0b315c`): The lighter end of the hero gradient. Exists
  to give the dark surface depth without introducing a second hue.

### Secondary

- **Sun Gold** (`#d18408`) and **Sun Gold Bright** (`#f4a31b`): Orientation, not
  emphasis. Every eyebrow label — `CONFERENCE:`, `NEXT GAME`, `MY TEAM`,
  `PAYMENT DUE` — is gold, and so is the letter inside a team crest. Gold tells
  you where you are; it never tells you what to do.

### Tertiary

- **Flag Scarlet** (`#d11f26`): Attention and outline. The unread notification
  dot, the unavailable-player marker, and the outer ring of a team crest.
  Deliberately rare.
- **Available Green** (`#188536`): A single semantic job — the affirmative half
  of the availability control, and a winning score on the results page. Not a
  brand color; a status color.
- **Court Blue** (`#174aa5`): Inline links only. Distinguishable from navy at
  body size without introducing a fourth identity hue.

### Neutral

- **Paper White** (`#fffdf9`) / **Paper Cream** (`#fbf8f3`): The app surface, a
  warm vertical gradient between the two. Never pure white — the warmth is what
  separates this from a dashboard.
- **Page Ground** (`#e9e5df`): The page behind the app on wide screens.
- **Ink Muted** (`#5d697a`): Secondary text, subtitles, supporting detail.
- **Hairline** (`#e5e1dc`): Borders and dividers. Warm-toned, never grey.

### Named Rules

**The Flag Rule.** Navy, gold, and scarlet are heritage, not theme. They may be
retinted for contrast but never replaced with an unrelated brand palette. A KCH
that is teal and slate is no longer KCH.

**The Gold Is A Signpost Rule.** Gold labels say where you are. It never
appears on a button, never carries an action, and never competes with navy for
the eye. If gold is the most prominent thing on a screen, the screen is wrong.

**The Warm Ground Rule.** No surface in this product is `#ffffff` or a neutral
grey. Every background carries warmth. The moment a screen goes cool-grey it
has drifted toward the anti-reference.

## Typography

**Display / Body / Label Font:** Inter, with `-apple-system`,
`BlinkMacSystemFont`, `"Segoe UI"` and a generic sans fallback.

**Character:** One family doing every job, separated by weight and size rather
than by contrast between typefaces. The effect is plain and unfussy — closer to
a printed team sheet than to a designed product. The tight display tracking
(`-1.1px`) is the only typographic flourish in the system, and it exists to make
a greeting feel like a headline.

### Hierarchy

- **Display** (700, 37px / 42px above 900px, line-height 1.02, tracking -1.1px):
  One per screen. The greeting or the page name. Never two.
- **Headline** (700, 22px): The name of the thing in a row — a team, a season,
  a balance.
- **Title** (400, 17px, muted): The subtitle under a display. A supporting
  sentence, not a heading.
- **Body** (400, 13px, line-height 1.4): Supporting detail inside a card —
  division and season, venue and court.
- **Label** (800, 12px, tracking 0.2px, gold): The eyebrow. Uppercase in use.
  Orients the reader before they read anything else.

### Named Rules

**The One Display Rule.** Exactly one 37px display per screen. Everything else
steps down. Two displays on one screen means the page has two subjects and
should be two pages.

**The Label Leads Rule.** A card announces itself with a gold label before it
says anything else. `MY TEAM` then the team name; `NEXT GAME` then the date.
The reader should be able to scan only the gold and know what the screen holds.

## Layout

**Phone first, and that is not a slogan.** The primary user is standing in or
near a gym. Every layout decision resolves toward the phone; the laptop layout
is an accommodation added above a single breakpoint.

**Below 900px:** a single column at `min(100%, 480px)`, 18px vertical rhythm and
24px side gutters, with a fixed bottom navigation bar and 112px of bottom
padding to clear it.

**At 900px and above:** the shell fills the viewport, side padding scales as
`clamp(32px, 4vw, 72px)`, and the bottom bar becomes a horizontal tab strip
beneath the header. Pages that carry two distinct subjects split into a
`1.05fr / 0.95fr` grid of independent column stacks; pages that carry one
subject stay single-column and cap at 1120px so a line never runs the width of a
monitor. The owner workspace is the exception at 1500px, because its pages are
rosters and schedule tables rather than reading columns.

**Spacing rhythm:** 8 / 10 / 14 / 18 / 22 / 24. Cards sit 14px apart in a stack
and carry 18px of internal padding.

### Named Rules

**The One Breakpoint Rule.** There is exactly one desktop breakpoint (900px) and
every rule above it lives inside that query. Nothing in the desktop layer may
leak out of it, because the phone and the laptop share one component tree and
one stylesheet — a rule that escapes silently changes the phone. This is
enforced by a test, not by discipline.

**The Thumb Rule.** Below the breakpoint, primary navigation stays within thumb
reach at the bottom edge. Above it, navigation moves to the top, where a pointer
and a reading eye already are.

## Elevation & Depth

**Flat by default; lift on state.** Surfaces rest flat. Shadow is a response to
interaction — hover, focus, or genuine elevation above the page — not a
permanent property of being a card. Depth otherwise comes from the tonal step
between the warm ground and the near-white card, and from the hairline border
that separates them.

> **Drift note.** The shipped implementation does not yet meet this. Cards
> currently carry a resting `0 8px 20px rgba(13, 38, 69, 0.08)`, and the phone
> shell carries a 50px ambient drop. The invariant above is the direction;
> future work should reduce resting shadow toward the hairline-and-tone
> separation rather than add more.

### Shadow Vocabulary

- **Ambient card** (`box-shadow: 0 8px 20px rgba(13, 38, 69, 0.08)`): The
  current resting card shadow. Being reduced.
- **Ambient control** (`box-shadow: 0 5px 14px rgba(13, 38, 69, 0.06)`): Small
  floating controls such as the header context pill.
- **Nav lift** (`box-shadow: 0 -5px 20px rgba(13, 38, 69, 0.08)`): The fixed
  bottom bar, casting upward onto content passing beneath it.

Every shadow in the system is tinted with navy rather than black. A neutral-grey
shadow on this warm ground reads as dirt.

### Named Rules

**The Navy Shadow Rule.** Shadows use `rgba(13, 38, 69, …)`, never
`rgba(0,0,0,…)`. The ground is warm; a black shadow muddies it.

## Shapes

Corners are consistently soft but never pill-shaped, with one deliberate
exception. The scale runs 9px for small controls, 12px for chips and inset
groups, 13px for actions, and 20px for cards.

The signature form is the **team crest**: a 68px square with
`border-radius: 18px 18px 45% 45%` — square-shouldered at the top, rounded to a
point below. It reads as a jersey shield or a crest patch, and it is the most
identifiable shape in the product. It carries a 4px `Sun Gold Bright` border and
a 2px `Flag Scarlet` outline over a `Flag Navy` field, with the team letter in
gold at weight 900.

The crest is the system's signature and is open to deliberate refinement, but it
should never be reduced to a plain circle or square avatar — the shape is doing
identity work that a circle cannot.

### Named Rules

**The No Pill Rule.** Interactive surfaces are rounded rectangles, not capsules.
The header context switcher was a capsule and read as a chip rather than a
control; it is now 9px. Full rounding is reserved for genuinely circular marks.

## Components

### Buttons

- **Shape:** Softly rounded (13px), no border, 15px padding, weight 800, centered.
- **Primary:** `Flag Navy` on white text. The only button style that carries a
  destination or a commitment.
- **Disabled:** 65% opacity with a `wait` cursor — the system's actions are
  server round-trips and the cursor says so.
- **Gold is never a button.** See The Gold Is A Signpost Rule.

### Cards

- **Corner:** 20px, the largest radius in the system.
- **Background:** White at 94% opacity, so the warm ground reads faintly through.
- **Border:** 1px `Hairline`.
- **Padding:** 18px.
- **Feature variant:** The Next Game hero inverts to a `Flag Navy` field with a
  navy-to-lifted gradient and a soft radial highlight, white text, 22px padding.
  One per screen at most.

### Navigation

- **Below 900px:** A fixed bottom bar, five items, icon above label, 11px label,
  active item in `Flag Navy` against `Ink Muted`. Status dots — scarlet for
  attention, green or red for team availability — sit at the icon's top-right.
- **At 900px and above:** The same component becomes a horizontal tab strip under
  the header. Icon beside label at 14px, a 2px `Flag Navy` underline on the
  active tab, and a hairline beneath the strip.
- Icons are Lucide at 22px (18px in the desktop strip), stroke width 2.

### Context Switcher

- A 9px-radius pill in the header carrying the current team name and a
  `ChevronDown`, at 82% white with a soft ambient shadow.
- Disabled when there is nothing to switch between, and rendered not at all when
  the player has no contexts.
- Opens a sheet from the bottom edge on phones; centers as a dialog above the
  breakpoint, dropping the drag handle that implies a swipe.

### Availability Control

- A two-position segmented control in a `#eef1f4` track with 4px inset padding
  and 12px radius. The selected half fills — `Available Green` for Yes,
  `#cf2e2e` for No — with white text at weight 900.
- The most-used control in the product. It is deliberately large and
  unambiguous, because it is answered quickly and often by people who are about
  to put a phone in a bag.

### Team Crest

See Shapes. Ships at 68px in the hero, 58px as a row roundel, and 44px inline.

## Do's and Don'ts

### Do:

- **Do** lead a card with its gold eyebrow label, then its subject.
- **Do** keep exactly one 37px display per screen.
- **Do** tint every shadow with navy (`rgba(13, 38, 69, …)`).
- **Do** keep every desktop rule inside the single `@media (min-width: 900px)`
  query — the phone and laptop share one stylesheet.
- **Do** size for a 40 Over player standing in a gym: large targets, nothing
  under 11px, nothing thin.
- **Do** use Lucide for icons, at a consistent stroke weight.

### Don't:

- **Don't** put gold on a button or an action. Gold orients; navy commits.
- **Don't** introduce a fourth identity hue. Green and scarlet are semantic;
  court blue is for links. The identity is navy and gold.
- **Don't** use pure white or neutral grey for any surface. Every ground is warm.
- **Don't** replace the flag palette with an arbitrary brand palette.
- **Don't** reduce the team crest to a circle or a plain square.
- **Don't** add resting shadow. Elevation is a response to state.
- **Don't** let the product drift toward institutional sports software — dense
  grey tables, committee features, no point of view. That is the confirmed
  anti-reference.
- **Don't** mistake the laptop layout for the target. The phone is the real
  usage scene.
