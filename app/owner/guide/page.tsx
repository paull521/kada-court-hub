import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  DollarSign,
  Home,
  ListChecks,
  User,
  Users,
  Wallet,
} from "lucide-react";
import OwnerPageShell from "@/components/OwnerPageShell";
import { getOwnerConferenceContext } from "@/lib/owner-data";

/**
 * The commissioner's handbook. Every word on it is fixed, so the page blocks
 * only on the conference context - the same read OwnerPageShell needs for its
 * header - and nothing here streams.
 *
 * It documents the pages the app links to and no others. /owner/uniforms,
 * /owner/more and /owner/conferences render but are reachable from nowhere in
 * the navigation, so the guide leaves them out rather than becoming the one
 * door into them.
 */

const sections = [
  ["map", "Where everything lives"],
  ["season", "A season, start to finish"],
  ["pages", "What each page does"],
  ["first", "What has to happen first"],
  ["words", "Words used here"],
  ["questions", "Questions"],
] as const;

const tabs = [
  {
    href: "/owner",
    icon: <Home className="ui-icon" />,
    name: "Home",
    body: "Six task tiles and the invitation that brings players into your conference. A red dot on a tile means something there is waiting for you.",
  },
  {
    href: "/owner/roster?view=teams",
    icon: <Users className="ui-icon" />,
    name: "Teams",
    body: "Every season, division and team, with each roster, its captain and co-captain, and the changes captains have asked you to approve.",
  },
  {
    href: "/owner/schedule",
    icon: <CalendarDays className="ui-icon" />,
    name: "Schedule",
    body: "Build a division's games, move or cancel one, finalize the division, and read the week-by-week table of a finished season.",
  },
  {
    href: "/owner/payments",
    icon: <Wallet className="ui-icon" />,
    name: "Payments",
    body: "Confirm what players say they paid, follow what each division has collected, and settle your own KCH season subscription.",
  },
  {
    href: "/profile?view=owner",
    icon: <User className="ui-icon" />,
    name: "Profile",
    body: "Your account, this conference's details, notification settings, support requests to KCH, and the way back to your player or captain view.",
  },
];

const sideDoors = [
  { href: "/owner/setup", name: "Season setup", from: "Home · Create Season Tournament" },
  { href: "/owner/roster", name: "Player directory", from: "Home · Manage conference players" },
  { href: "/owner/scores", name: "Scoresheets", from: "Home · Update game results" },
  { href: "/owner/financials", name: "Financial summary", from: "Home · Track profit and loss" },
];

const steps = [
  {
    name: "Create Season",
    body: "Name the season, set its first and last day, and choose whether players may register straight away. If an earlier season has finished its setup you can add a division to that one instead of starting a new season — its divisions, rosters, payments and schedules are left alone.",
  },
  {
    name: "Add Divisions",
    body: "Up to ten in a season. Say how many you are making, name them, and save them as a group. Another one can be added later.",
  },
  {
    name: "Add Teams",
    body: "One division at a time: choose the number of teams, name every one, save the group. Up to thirty in a batch.",
  },
  {
    name: "Assign Captains",
    body: "Search the player directory for each team's captain and co-captain. They register like everyone else, and nobody may lead two teams in the same season.",
  },
  {
    name: "Fees & Uniforms",
    body: "Per division: turn the league fee and the uniform fee on or off and set the amounts. Uniform photos are optional here and can be copied from a division you ran before.",
    gate: "Every division needs its fees saved before this step will let you continue",
  },
  {
    name: "Invite Players",
    body: "Per division: tick exactly who is invited, set players per team and the date you need an answer by, attach a flyer if you have one, and send. KCH drafts the message and you can rewrite it; captains are already counted. A join link for the division appears once the invitation goes out.",
    gate: "Stays open through drafting, so a late player can still be invited",
  },
  {
    name: "Draft Rosters",
    body: "Per division: see who is joining, who is waitlisted and who has not answered. Captains draft, and you can place a player yourself with the owner override. Approve each team, share the division for review with a deadline, then publish the final roster. There is a draft sheet to download if you would rather run the draft on paper.",
    gate: "Final publishing opens once the review deadline passes and every team is approved",
  },
  {
    name: "Build Schedule",
    body: "Give each division its games — enter every game day yourself, or let KCH build a draft round robin from your courts, days and start time. Review it, then finalize so the players can see it.",
    gate: "A division needs its final roster published first",
  },
];

const pages = [
  {
    href: "/owner",
    icon: <Home className="ui-icon" />,
    name: "Home",
    where: "The Home tab",
    can: [
      "Open any of the six tasks, and read the count under each one: the setup step you are on, games scheduled, results missing, balances due.",
      "Copy the conference player invitation or show its QR code, which is how a new player joins your directory.",
      "Switch conferences from the chip beside the logo, if you run more than one.",
    ],
  },
  {
    href: "/owner/setup",
    icon: <ListChecks className="ui-icon" />,
    name: "Season setup",
    where: "Home · Create Season Tournament",
    can: [
      "Work through the eight steps. A step locks when you continue, and the wizard reopens at wherever you left off.",
      "Add a division to a season that has already finished its setup.",
      "Cancel a season. Nothing is deleted — its teams, rosters, responses, payments and history all stay.",
    ],
  },
  {
    href: "/owner/roster",
    icon: <User className="ui-icon" />,
    name: "Player directory",
    where: "Home · Manage conference players",
    can: [
      "See every player in the conference with their phone, email and the number of divisions they have joined.",
      "Set a player active, suspended or inactive.",
      "Put a player on a team — late registrants, undrafted players, and anyone left without one.",
      "Read the totals: players in the directory, players playing this season, active and inactive.",
    ],
  },
  {
    href: "/owner/roster?view=teams",
    icon: <Users className="ui-icon" />,
    name: "Teams",
    where: "The Teams tab",
    can: [
      "Open a season, then a division, then a team, and read its roster with jersey numbers, positions and contact details.",
      "Change or remove a team's captain and co-captain.",
      "Return a player to the draft pool with a reason. A captain has to be replaced before they can be moved.",
      "Approve or decline the roster changes captains request. Declining needs a note.",
    ],
  },
  {
    href: "/owner/schedule",
    icon: <CalendarDays className="ui-icon" />,
    name: "Schedule",
    where: "The Schedule tab",
    can: [
      "Enter a game day yourself: the date, venue and length, then each game's time, court and two teams.",
      "Or have KCH build a draft from your first date, days played, courts, minutes per game and games per day — single or double round robin. No team is given two games in one day.",
      "See which round-robin matchups are still missing before you finalize.",
      "Finalize a division's schedule. That is the moment its players can see it.",
      "Move a game to another date, venue or court and send both teams the reason.",
      "Cancel a game with a reason.",
      "Add a single game after finalizing. Playoff games unlock once every regular-season game in the division has a result.",
      "Read a finished season week by week in the archive.",
      "Uniforms need no decision: home wears light and away wears dark, on every game KCH creates.",
    ],
  },
  {
    href: "/owner/scores",
    icon: <ClipboardList className="ui-icon" />,
    name: "Scoresheets",
    where: "Home · Update game results",
    can: [
      "Save a score as a draft while a game is still being checked.",
      "Post the final score. Finalized games stop accepting edits and feed the standings and results players see.",
    ],
  },
  {
    href: "/owner/payments",
    icon: <Wallet className="ui-icon" />,
    name: "Payments",
    where: "The Payments tab",
    can: [
      "Confirm or decline the Zelle and cash notices players send you. Only a confirmed notice moves a balance.",
      "Approve or decline a request to waive a fee.",
      "Per season and division: how many players have paid, not paid and been waived; how much arrived by Zelle and by cash; expected income, income received, outstanding and waived.",
      "Open one player for what they owe, what they have paid and how they paid it.",
      "Look back at completed seasons, kept in their own archive.",
      "Settle your KCH season subscription and see the player-access charge for each active division.",
    ],
  },
  {
    href: "/owner/financials",
    icon: <DollarSign className="ui-icon" />,
    name: "Financial summary",
    where: "Home · Track profit and loss",
    can: [
      "Read what the season took in, split into league fees and uniform fees, against what it expected to take in.",
      "Enter what the season cost you — courts, referees, uniforms, league operations — and keep notes with it.",
      "See profit or loss for each season.",
    ],
  },
];

const gates: Array<[string, string]> = [
  ["Send a division's invitations", "every division in that season has its fees saved"],
  ["Share a division's rosters for review", "every team in that division is approved"],
  ["Publish a final roster", "the review deadline has passed and every team is approved"],
  ["Build a division's schedule", "that division's final roster is published"],
  ["Finalize a schedule", "every round-robin matchup is on the calendar"],
  ["Add a playoff game", "every regular-season game in the division has a result"],
  ["Change what a player owes", "you confirm their payment notice"],
  ["Decline a payment, waiver or roster change", "you write a note explaining it"],
];

const words: Array<[string, string]> = [
  [
    "Conference",
    "The league you run. Everything else sits inside it, and nothing crosses from one conference into another.",
  ],
  ["Season", "One run of play with a first and last day. A conference can hold several."],
  [
    "Division",
    "A bracket inside a season with its own teams, fees, rosters and schedule. Up to ten, and no division ever waits for another.",
  ],
  ["Team", "Up to thirty in a division, each with a captain and a co-captain."],
  [
    "Directory",
    "Every player who has joined your conference. Invitations are picked from this list.",
  ],
  ["Draft pool", "The invited players who said they are joining and have no team yet."],
  ["Waitlist", "Players who answered yes after the roster spots for their division were filled."],
  [
    "Draft status",
    "Where a team's roster stands with you: pending approval, changes requested, or approved.",
  ],
  [
    "Review window",
    "The days between sharing a division's rosters and publishing the final one, while players check where they landed.",
  ],
  [
    "Payment notice",
    "A player telling you they paid by Zelle or cash. It stays a claim until you confirm it.",
  ],
  ["Waiver", "A player asking for a fee to be dropped rather than paid."],
];

const questions: Array<[string, string]> = [
  [
    "A tile has a red dot. What does it want?",
    "Something on that page is waiting for you — a setup step in progress, a roster change a captain has requested, a finished game with no result, or a payment notice to review.",
  ],
  [
    "Can I add a division after the season has started?",
    "Yes. Season setup offers it on any season that has finished all eight steps, and the divisions already running are left exactly as they are.",
  ],
  [
    "A player registered late.",
    "Player directory, then “Add late invitation or move players”: pick the division, the player and the team. You can also invite them from Step 6, which stays open through drafting.",
  ],
  [
    "I put a player on the wrong team.",
    "Teams, then the season, division and team. Open the player and return them to the draft pool with a reason, then place them again. A captain has to be replaced under Team Leadership first.",
  ],
  [
    "Players say they cannot see the schedule.",
    "A division's games are private until you finalize that division's schedule.",
  ],
  [
    "Does anyone get told when I change something?",
    "Yes. Moving or cancelling a game, sharing a roster, publishing a final roster and finalizing a schedule all notify the players concerned.",
  ],
  [
    "Something looks wrong and I need help.",
    "Profile, then the support request. Your earlier requests and their replies are kept in the same place.",
  ],
];

export default async function OwnerGuidePage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Owner's Guide"
      subtitle="What a commissioner can do, and where each of it lives."
      active="home"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <div className="owner-guide">
        <nav className="owner-guide-index" aria-label="Guide sections">
          {sections.map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
        <div className="owner-guide-body">
          <section className="guide-opening">
            <p>
              You are the commissioner of <b>{context.conferenceName}</b>. Every player, season,
              team, game and payment on the pages below belongs to it, and nothing you do here
              reaches another conference.
            </p>
            <small>
              The whole job runs in one direction: a season holds divisions, a division holds teams,
              and a team holds players. Almost every screen asks you to pick a season and a division
              first for that reason.
            </small>
          </section>

          <section className="owner-guide-section" id="map">
            <h2>Where everything lives</h2>
            <p className="guide-lead">Five tabs, in the strip at the top of every owner page.</p>
            <div className="guide-map">
              {tabs.map((tab) => (
                <Link href={tab.href} key={tab.name}>
                  <span className="guide-map-icon">{tab.icon}</span>
                  <b>{tab.name}</b>
                  <span>{tab.body}</span>
                </Link>
              ))}
            </div>
            <p className="guide-lead guide-lead-spaced">
              Four more pages have no tab of their own. Each one is a tile on Home.
            </p>
            <div className="guide-doors">
              {sideDoors.map((door) => (
                <Link href={door.href} key={door.href}>
                  <b>{door.name}</b>
                  <small>{door.from}</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="owner-guide-section" id="season">
            <h2>A season, start to finish</h2>
            <p className="guide-lead">
              Season setup walks these eight steps in order and remembers where you stopped. Four of
              them wait on something before they will let you through.
            </p>
            <ol className="guide-rail">
              {steps.map((step, index) => (
                <li
                  className="relative pb-[24px] pl-[46px] before:absolute before:top-[36px] before:bottom-[2px] before:left-[15px] before:w-[2px] before:rounded-[2px] before:bg-[linear-gradient(180deg,rgba(209,132,8,0.5),rgba(209,132,8,0.14))] before:content-[''] last:pb-0 last:before:hidden desk:pb-[28px] desk:pl-[56px] desk:before:top-[44px] desk:before:left-[18px]"
                  key={step.name}
                >
                  <b className="absolute top-0 left-0 grid h-[32px] w-[32px] place-items-center rounded-[11px] bg-[linear-gradient(145deg,#082b50,#0e477c)] text-[13px] font-[900] text-white shadow-[0_4px_12px_rgba(13,38,69,0.24)] desk:h-[38px] desk:w-[38px] desk:rounded-[13px] desk:text-[15px]">
                    {index + 1}
                  </b>
                  <h3 className="m-[5px_0] text-[17px] tracking-[-0.3px] desk:mt-[8px] desk:text-[19px]">
                    {step.name}
                  </h3>
                  <p className="m-0 max-w-[60ch] text-[14px] leading-[1.55] text-[#3f4e61] desk:text-[15px]">
                    {step.body}
                  </p>
                  {step.gate && (
                    <em className="mt-[9px] inline-block rounded-[9px] bg-[#fdf3e0] px-[11px] py-[6px] text-[12px] leading-[1.4] font-[700] text-[#8a5c05] not-italic">
                      {step.gate}
                    </em>
                  )}
                </li>
              ))}
            </ol>
            <Link href="/owner/setup" className="btn primary guide-jump">
              Open Season Setup
            </Link>
          </section>

          <section className="owner-guide-section" id="pages">
            <h2>What each page does</h2>
            <p className="guide-lead">
              Every ability in the owner workspace, page by page. Each heading opens the page it
              describes.
            </p>
            <div className="grid border-t border-line">
              {pages.map((page) => (
                <article
                  className="grid grid-cols-[36px_minmax(0,1fr)] gap-[12px] border-b border-line p-[18px_2px] desk:grid-cols-[42px_minmax(0,1fr)] desk:gap-[16px] desk:p-[22px_2px]"
                  key={page.name}
                >
                  <span className="grid h-[36px] w-[36px] place-items-center rounded-[12px] bg-[#f2f5f9] text-[#4d6d95] desk:h-[42px] desk:w-[42px]">
                    {page.icon}
                  </span>
                  <div>
                    <h3 className="m-0 text-[17px] tracking-[-0.3px] [&_a]:border-b-2 [&_a]:border-[rgba(209,132,8,0.35)]">
                      <Link href={page.href}>{page.name}</Link>
                    </h3>
                    <small className="mt-[3px] block text-[12px] text-muted">{page.where}</small>
                    <ul className="guide-ability-list">
                      {page.can.map((ability) => (
                        <li key={ability}>{ability}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="owner-guide-section" id="first">
            <h2>What has to happen first</h2>
            <p className="guide-lead">
              When a button is greyed out, it is almost always one of these. The button says which
              one, and turns itself on the moment the condition is met.
            </p>
            <div className="guide-gates">
              {gates.map(([want, need]) => (
                <p className="guide-gate" key={want}>
                  <b>{want}</b>
                  <span>once {need}.</span>
                </p>
              ))}
            </div>
          </section>

          <section className="owner-guide-section" id="words">
            <h2>Words used here</h2>
            <p className="guide-lead">
              The same eleven words appear on every owner screen. This is what each of them means.
            </p>
            <dl className="guide-terms">
              {words.map(([term, meaning]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="owner-guide-section" id="questions">
            <h2>Questions</h2>
            <p className="guide-lead">The seven that come up most often.</p>
            <div className="grid gap-[8px]">
              {questions.map(([question, answer]) => (
                <details
                  key={question}
                  className="group rounded-[14px] border border-line bg-white/[0.86]"
                >
                  <summary className="cursor-pointer list-none p-[13px_15px] text-[14px] font-[700] after:float-right after:ml-[12px] after:font-[800] after:text-gold after:content-['+'] group-open:pb-[4px] group-open:after:content-['–'] desk:text-[15px] [&::-webkit-details-marker]:hidden">
                    {question}
                  </summary>
                  <p className="m-0 max-w-[66ch] px-[15px] pb-[14px] text-[13.5px] leading-[1.55] text-[#435162] desk:text-[14px]">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <p className="guide-closing">
            Anything this guide does not answer can go to KCH from your Profile, under support.
          </p>
        </div>
      </div>
    </OwnerPageShell>
  );
}
