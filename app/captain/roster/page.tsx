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
          <details className="card captain-roster-disclosure">
            <summary>
              <span>
                <i>
                  <Check className="ui-icon" />
                </i>
                <span>
                  <b>Published Roster</b>
                  <small>Open the published team list.</small>
                </span>
              </span>
              <strong aria-hidden="true">
                <ChevronRight className="go-caret" />
              </strong>
            </summary>
            <div className="captain-final-team">
              {data.roster.map((player) => (
                <div className="roster-row" key={player.registrationId}>
                  <b className="jersey">{player.jerseyNumber ?? "—"}</b>
                  <span className="roster-player-name">
                    <strong>{player.name}</strong>
                    <small>
                      {player.jerseyName ? `${player.jerseyName} · ` : ""}
                      {player.position || "Position not set"}
                    </small>
                  </span>
                  <em>{player.role}</em>
                </div>
              ))}
            </div>
          </details>
          <details className="card captain-roster-disclosure captain-player-details-disclosure">
            <summary>
              <span>
                <i>
                  <User className="ui-icon" />
                </i>
                <span>
                  <b>Change Player Details</b>
                  <small>Update Jersey Number, Name, Position and Uniform Size</small>
                </span>
              </span>
              <strong aria-hidden="true">
                <ChevronRight className="go-caret" />
              </strong>
            </summary>
            <div>
              <CaptainDraftRoster data={data} detailsOnly />
            </div>
          </details>
        </>
      )}
      <details className="card captain-roster-disclosure">
        <summary>
          <span>
            <i>
              <ArrowLeftRight className="ui-icon" />
            </i>
            <span>
              <b>Request Change</b>
              <small>Send a team change for owner approval.</small>
            </span>
          </span>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div>
          <CaptainRequestForm data={data} enabled={data.draftPublished} />
        </div>
      </details>
      <details className="card captain-roster-disclosure">
        <summary>
          <span>
            <i>
              <List className="ui-icon" />
            </i>
            <span>
              <b>Request History</b>
              <small>
                {data.requests.length
                  ? `${data.requests.length} request${data.requests.length === 1 ? "" : "s"}`
                  : "No requests yet"}
              </small>
            </span>
          </span>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div>
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
