import { Suspense } from "react";
import { ArrowLeftRight, Check, ChevronRight, List, User } from "lucide-react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainRequestForm from "@/components/CaptainRequestForm";
import CaptainDraftRoster from "@/components/CaptainDraftRoster";
import CaptainRosterFrame from "@/components/CaptainRosterFrame";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

/** Only two statuses colour the pill; anything else keeps the grey default. */
const requestTone: Record<string, string> = {
  approved: "bg-[#eaf6ec] text-[#18753a]",
  declined: "bg-[#fff1f1] text-[#a51118]",
};
const labels: Record<string, string> = {
  trade: "Trade",
  add_player: "Add Player",
  remove_player: "Remove Player",
  other: "Other",
};

export default async function CaptainRosterPage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell
      data={data}
      active="dashboard"
      title="Team Roster"
      subtitle="Build, submit, and revise your team roster."
    >
      <Suspense fallback={<CaptainRosterFrame />}>
        <RosterBody data={data} />
      </Suspense>
    </CaptainShell>
  );
}

async function RosterBody({ data: portal }: { data: Promise<CaptainPortalData> }) {
  const data = await portal;
  return (
    <>
      {!data.finalPublished && <CaptainDraftRoster data={data} />}
      {data.finalPublished && (
        <>
          <details className="group mb-[14px] overflow-hidden rounded-[18px] border border-line bg-[rgba(255,255,255,0.96)] shadow-[0_8px_20px_rgba(13,38,69,0.08)]">
            <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-[12px] p-[15px_17px] [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-[11px]">
                <i className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#fff0d5] font-[900] text-[#b76b00] not-italic">
                  <Check className="ui-icon" />
                </i>
                <span className="grid gap-[3px]">
                  <b className="text-[16px]">Published Roster</b>
                  <small className="text-[11px] text-[#637083]">
                    Open the published team list.
                  </small>
                </span>
              </span>
              <strong
                aria-hidden="true"
                className="text-[22px] transition-transform group-open:rotate-90"
              >
                <ChevronRight className="go-caret" />
              </strong>
            </summary>
            {/* This list no longer uses the shared roster-list class names.
                It was the densest of the four that share them and carried six
                overrides across two stylesheets to get there, three with
                !important; it states its own measurements instead. The names
                are still in globals.css for CaptainTeamFrame, which uses them
                at their own sizes.

                Deliberately not written out here: css-usage.mjs greps source
                text, and a class named in a comment reads to it as a class
                that is rendered. */}
            <div className="border-t border-[#e3e6ea] px-[12px]">
              {data.roster.map((player) => (
                <div
                  className="grid min-h-[67px] grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-[12px] border-b border-line p-[14px_0] text-[14px] last:border-0"
                  key={player.registrationId}
                >
                  <b className="min-w-[30px] rounded-[14px] bg-[#f0efed] p-[7px_4px] text-center text-[15px]">
                    {player.jerseyNumber ?? "—"}
                  </b>
                  <span className="grid min-w-0 gap-[4px] text-navy">
                    <strong className="text-[15px] leading-[1.2]">{player.name}</strong>
                    <small className="text-[12px] leading-[1.2] font-medium text-muted">
                      {player.jerseyName ? `${player.jerseyName} · ` : ""}
                      {player.position || "Position not set"}
                    </small>
                  </span>
                  <em className="min-w-[64px] text-right text-[12px] leading-[1.2] text-[#b76b00] not-italic">
                    {player.role}
                  </em>
                </div>
              ))}
            </div>
          </details>
          {/* captain-player-details-disclosure keeps its class with no rule of
              its own: it re-scopes .captain-draft-entry inside it. */}
          <details className="captain-player-details-disclosure group mb-[14px] overflow-hidden rounded-[18px] border border-line bg-[rgba(255,255,255,0.96)] shadow-[0_8px_20px_rgba(13,38,69,0.08)]">
            <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-[12px] p-[15px_17px] [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-[11px]">
                <i className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#fff0d5] font-[900] text-[#b76b00] not-italic">
                  <User className="ui-icon" />
                </i>
                <span className="grid gap-[3px]">
                  <b className="text-[16px]">Change Player Details</b>
                  <small className="text-[11px] text-[#637083]">
                    Update Jersey Number, Name, Position and Uniform Size
                  </small>
                </span>
              </span>
              <strong
                aria-hidden="true"
                className="text-[22px] transition-transform group-open:rotate-90"
              >
                <ChevronRight className="go-caret" />
              </strong>
            </summary>
            <div className="border-t border-[#e3e6ea] bg-[#fcfbf9] p-[15px_17px]">
              <CaptainDraftRoster data={data} detailsOnly />
            </div>
          </details>
        </>
      )}
      <details className="group mb-[14px] overflow-hidden rounded-[18px] border border-line bg-[rgba(255,255,255,0.96)] shadow-[0_8px_20px_rgba(13,38,69,0.08)]">
        <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-[12px] p-[15px_17px] [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-[11px]">
            <i className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#fff0d5] font-[900] text-[#b76b00] not-italic">
              <ArrowLeftRight className="ui-icon" />
            </i>
            <span className="grid gap-[3px]">
              <b className="text-[16px]">Request Change</b>
              <small className="text-[11px] text-[#637083]">
                Send a team change for owner approval.
              </small>
            </span>
          </span>
          <strong
            aria-hidden="true"
            className="text-[22px] transition-transform group-open:rotate-90"
          >
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="border-t border-[#e3e6ea] bg-[#fcfbf9] p-[15px_17px]">
          <CaptainRequestForm data={data} enabled={data.draftPublished} />
        </div>
      </details>
      <details className="group mb-[14px] overflow-hidden rounded-[18px] border border-line bg-[rgba(255,255,255,0.96)] shadow-[0_8px_20px_rgba(13,38,69,0.08)]">
        <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-[12px] p-[15px_17px] [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-[11px]">
            <i className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#fff0d5] font-[900] text-[#b76b00] not-italic">
              <List className="ui-icon" />
            </i>
            <span className="grid gap-[3px]">
              <b className="text-[16px]">Request History</b>
              <small className="text-[11px] text-[#637083]">
                {data.requests.length
                  ? `${data.requests.length} request${data.requests.length === 1 ? "" : "s"}`
                  : "No requests yet"}
              </small>
            </span>
          </span>
          <strong
            aria-hidden="true"
            className="text-[22px] transition-transform group-open:rotate-90"
          >
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="border-t border-[#e3e6ea] bg-[#fcfbf9] p-[15px_17px]">
          {data.requests.length ? (
            <div className="grid gap-0 [&_article:last-child]:border-b-0 [&_article>p]:col-span-full [&_article>p]:m-[4px_0] [&_article>p]:text-[12px] [&_article>p]:leading-[1.45] [&_article>p]:text-muted [&_article>span]:grid [&_article>span]:gap-[3px] [&_article]:grid [&_article]:grid-cols-[1fr_auto] [&_article]:items-start [&_article]:gap-[4px] [&_article]:rounded-none [&_article]:border-0 [&_article]:border-b [&_article]:border-line [&_article]:bg-transparent [&_article]:p-[13px_0] [&_small]:text-[10px] [&_small]:text-[#6d7886]">
              {data.requests.map((request) => (
                <article key={request.id}>
                  <span>
                    <b>{labels[request.type] ?? "Other"}</b>
                    <small>
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                        new Date(request.createdAt),
                      )}
                    </small>
                  </span>
                  <em
                    className={`rounded-full px-[8px] py-[5px] text-[9px] font-[800] capitalize not-italic ${requestTone[request.status] ?? "bg-[#eef1f4] text-[#556170]"}`}
                  >
                    {request.status}
                  </em>
                  <p>{request.details}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-note">No roster requests yet.</p>
          )}
        </div>
      </details>
    </>
  );
}
