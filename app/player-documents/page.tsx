import { BookOpen, FileCheck, Image } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getPlayerPortalData } from "@/lib/kch-data";
import { getAvailableRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { accountLink, accountRow } from "@/components/ui/account-classes";

type DocumentRow = {
  invitation_id: string | null;
  registration_id: string | null;
  conference_name: string;
  season_name: string;
  division_name: string;
  document_type: "rules" | "participation_agreement" | "multimedia_release";
  document_id: string;
  title: string;
  version: string;
  response: "acknowledged" | "accepted" | "declined" | null;
};

const labels = {
  rules: "Rules & Discipline",
  participation_agreement: "Basketball Participation Agreement",
  multimedia_release: "Photo, Video, and Multimedia Release",
} as const;
const icons = {
  rules: BookOpen,
  participation_agreement: FileCheck,
  multimedia_release: Image,
} as const;
const documentOrder = { rules: 0, participation_agreement: 1, multimedia_release: 2 } as const;
const status = (value: DocumentRow["response"]) =>
  value === "acknowledged" ? "Acknowledged" : value === "accepted" ? "Accepted" : value === "declined" ? "Declined" : "";

export default async function PlayerDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string; registration?: string; view?: string }>;
}) {
  const params = await searchParams;
  const [data, roles, supabase] = await Promise.all([
    getPlayerPortalData("profile"),
    getAvailableRoles(),
    createClient(),
  ]);
  const role =
    params.view === "captain" && roles.captain
      ? "captain"
      : params.view === "owner" && roles.owner
        ? "owner"
        : "player";
  if (role === "owner") redirect("/profile?view=owner");
  const registrationId = params.registration || data.activeRegistrationId || "";
  const { data: packet } = await supabase.rpc("get_player_document_packet", {
    p_invitation_id: params.invitation || null,
    p_registration_id: params.invitation ? null : registrationId || null,
  });
  const documents = ((packet ?? []) as DocumentRow[]).sort(
    (left, right) => documentOrder[left.document_type] - documentOrder[right.document_type],
  );
  const first = documents[0];
  if (!first) redirect("/profile" + (role === "captain" ? "?view=captain" : ""));
  const scope = first.invitation_id
    ? `invitation=${encodeURIComponent(first.invitation_id)}`
    : `registration=${encodeURIComponent(first.registration_id ?? registrationId)}`;
  const view = role === "captain" ? "&view=captain" : "";
  return (
    <AppShell
      active="profile"
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      role={role}
      contentClass="reading-content"
    >
      <h1 className="title">Player Documents</h1>
      <p className="subtitle">
        {first.conference_name} · {first.season_name} · {first.division_name}
      </p>
      <section className="card grid gap-[16px] p-[18px] [&_h2]:m-0 [&_h2]:text-[17px] [&_h3]:m-0 [&_h3]:text-[14px] [&_p]:m-0 [&_p]:text-[13px] [&_p]:leading-[1.55] [&_ul]:m-0 [&_ul]:grid [&_ul]:gap-[4px] [&_ul]:pl-[18px] [&_li]:text-[13px] [&_li]:leading-[1.45]">
        <p>Before joining <b>{first.conference_name} · {first.season_name} · {first.division_name}</b>, review and respond to each document below.</p>
        <section className="grid gap-[7px]"><h2>1. Rules and Discipline</h2><p>You will review the Conference’s rules for:</p><ul><li>Player eligibility and approved rosters</li><li>Game conduct and sportsmanship</li><li>Technical fouls, ejections, and fighting</li><li>Suspensions, appeals, and Conference Owner authority</li></ul><p><b>Required:</b> Acknowledge the Rules and Discipline document.</p></section>
        <section className="grid gap-[7px]"><h2>2. Basketball Participation Agreement</h2><p>Basketball involves risk. This agreement covers:</p><ul><li>Assumption of risk</li><li>Health, injury reporting, and concussion safety</li><li>Emergency medical authorization</li><li>Release of liability</li><li>Insurance and personal-property responsibility</li></ul><p><b>Required:</b> Accept the agreement and enter your full legal name as your electronic signature.</p></section>
        <section className="grid gap-[7px]"><h2>3. Photo Video and Multimedia Release</h2><p>This document asks whether the Conference may use your name, image, voice, team affiliation, and game activity for Conference-related media.</p><ul><li><b>Accept</b> — gives permission for the uses described in the full release.</li><li><b>Decline</b> — does not affect registration, eligibility, or participation.</li><li>You may change an accepted choice later for future use.</li></ul><p><b>Required:</b> Choose Accept or Decline.</p></section>
        <section className="grid gap-[7px]"><h2>Your Records</h2><ul><li>Each document is separate.</li><li>Your response is saved with its document version, conference, season, division, and timestamp.</li><li>You can review completed documents later in <b>Profile → Player Documents</b>.</li></ul><p>Please open and review each complete document before responding.</p></section>
      </section>
      <section className="mt-[14px] grid gap-[10px]">
        {documents.map((document) => {
          const Icon = icons[document.document_type];
          return (
            <Link
              key={document.document_type}
              href={`/player-documents/${document.document_type}?${scope}${view}`}
              className={`card ${accountRow} ${accountLink} relative pr-[42px] [&>strong]:absolute [&>strong]:right-[16px]`}
            >
              <span><Icon className="ui-icon" /></span>
              <b>{labels[document.document_type]}</b>
              {status(document.response) ? <em className="not-italic text-[12px] text-green">{status(document.response)}</em> : null}
              <strong aria-hidden="true">›</strong>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
