"use client";

import Link from "next/link";
import { useActionState } from "react";
import { respondInvitationAction, type InvitationActionState } from "@/app/home/actions";
import {
  invitationFacts,
  invitationNote,
  invitationPlatformNote,
  invitationSummary,
  responseDeadline,
} from "@/components/ui/shared-classes";

const initialState: InvitationActionState = {};
type Invitation = {
  id: string;
  conferenceName: string;
  ownerName: string;
  seasonName: string;
  divisionName: string;
  startsOn: string;
  endsOn: string;
  leagueFee: number;
  uniformFee: number;
  message: string;
  response: "pending" | "joining" | "not_joining";
  responseDeadline: string;
  teamCount: number;
  playersPerTeam: number;
  invitedCount: number;
};
const date = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : "To be announced";
export default function SeasonInvitationCard({ invitation }: { invitation: Invitation }) {
  const [state, action, pending] = useActionState(respondInvitationAction, initialState);
  return (
    <section className="card mb-[15px] grid gap-[13px] border-[#e8b85e]! p-[18px] [&>h2]:m-[0_0_7px] [&>h2]:text-[22px] [&>p:not(.eyebrow)]:m-[0_0_14px] [&>p:not(.eyebrow)]:text-[13px] [&>p:not(.eyebrow)]:leading-[1.5] [&>p:not(.eyebrow)]:text-muted [&_.eyebrow]:m-0! [&_form]:grid [&_form]:grid-cols-2 [&_form]:gap-2">
      <p className="eyebrow">YOU’RE INVITED</p>
      <div className="grid gap-[5px] rounded-[15px] bg-[linear-gradient(135deg,#061f3d,#10497e)] p-[19px_16px] text-center text-white [&>span]:text-[26px] [&>h2]:m-0 [&>h2]:text-2xl [&>h2]:text-white [&>small]:text-[11px] [&>small]:text-[#f5c866]">
        <span>🏀</span>
        <h2>{invitation.conferenceName}</h2>
        <small>Hosted by {invitation.ownerName}</small>
      </div>
      <div className={invitationSummary}>
        <b>
          {invitation.seasonName} · {invitation.divisionName}
        </b>
        <span>
          {date(invitation.startsOn)} – {date(invitation.endsOn)}
        </span>
      </div>
      <div className={invitationFacts}>
        <span>
          <b>{invitation.teamCount}</b> Teams
        </span>
        <span>
          <b>{invitation.playersPerTeam}</b> Players / team
        </span>
        <span>
          <b>${(invitation.leagueFee + invitation.uniformFee).toFixed(0)}</b> Total fees
        </span>
      </div>
      {invitation.responseDeadline && (
        <p className={responseDeadline}>Please respond by {date(invitation.responseDeadline)}</p>
      )}
      <p className={invitationNote}>{invitation.message}</p>
      <form action={action}>
        <input type="hidden" name="invitationId" value={invitation.id} />
        <Link className="btn bg-green! text-white!" href={`/rules?invitation=${invitation.id}`}>
          Join this season
        </Link>
        <button
          className="btn border! border-[#d6dbe2]! bg-white!"
          name="response"
          value="not_joining"
          disabled={pending}
        >
          Not Joining
        </button>
      </form>
      <small className={invitationPlatformNote}>
        KadaCourtHub · One Team. One Court. One Family.
      </small>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
    </section>
  );
}
