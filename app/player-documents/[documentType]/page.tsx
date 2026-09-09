import { BookOpen, FileCheck, Image } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { RulesDocument } from "@/components/ui/RulesDocument";
import { getPlayerPortalData } from "@/lib/kch-data";
import { getAvailableRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import PlayerDocumentResponseForm from "../PlayerDocumentResponseForm";

type DocumentType = "rules" | "participation_agreement" | "multimedia_release";
type DocumentRow = {
  invitation_id: string | null;
  registration_id: string | null;
  conference_name: string;
  season_name: string;
  division_name: string;
  document_type: DocumentType;
  document_id: string;
  title: string;
  version: string;
  effective_date: string;
  content: string;
  response: "acknowledged" | "accepted" | "declined" | null;
  responded_at: string | null;
};
const validType = (value: string): value is DocumentType =>
  value === "rules" || value === "participation_agreement" || value === "multimedia_release";
const icons = { rules: BookOpen, participation_agreement: FileCheck, multimedia_release: Image };
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default async function PlayerDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentType: string }>;
  searchParams: Promise<{ invitation?: string; registration?: string; view?: string }>;
}) {
  const [{ documentType }, query] = await Promise.all([params, searchParams]);
  if (!validType(documentType)) notFound();
  const [data, roles, supabase] = await Promise.all([
    getPlayerPortalData("profile"),
    getAvailableRoles(),
    createClient(),
  ]);
  const role = query.view === "captain" && roles.captain ? "captain" : "player";
  const registrationId = query.registration || data.activeRegistrationId || "";
  const { data: packet } = await supabase.rpc("get_player_document_packet", {
    p_invitation_id: query.invitation || null,
    p_registration_id: query.invitation ? null : registrationId || null,
  });
  const document = ((packet ?? []) as DocumentRow[]).find((item) => item.document_type === documentType);
  if (!document) redirect("/profile" + (role === "captain" ? "?view=captain" : ""));
  const Icon = icons[documentType];
  const returnScope = document.invitation_id
    ? `invitation=${encodeURIComponent(document.invitation_id)}`
    : `registration=${encodeURIComponent(document.registration_id ?? registrationId)}`;
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
      <h1 className="title">{document.title}</h1>
      <p className="subtitle">{document.conference_name} · {document.season_name} · {document.division_name}</p>
      <RulesDocument
        icon={<Icon className="ui-icon" />}
        title={document.title}
        meta={`Version ${document.version}`}
        footer={
          document.response ? (
            <footer>
              <b>{document.response === "declined" ? "Declined" : document.response === "accepted" ? "Accepted" : "Acknowledged"}</b>
              {document.responded_at ? <span>{timestamp(document.responded_at)}</span> : null}
            </footer>
          ) : (
            <PlayerDocumentResponseForm
              invitationId={document.invitation_id ?? ""}
              registrationId={document.registration_id ?? registrationId}
              documentType={documentType}
              documentId={document.document_id}
            />
          )
        }
      >
        {document.content.split("\n\n").map((section, index) => {
          const [heading, ...body] = section.split("\n");
          return <section key={index}>{/^\d+\.|^Signature/.test(heading) ? <h3>{heading}</h3> : <p>{heading}</p>}{body.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}</section>;
        })}
      </RulesDocument>
      <Link className="btn secondary mt-[14px] block w-full" href={`/player-documents?${returnScope}${view}`}>
        Back to Player Documents
      </Link>
    </AppShell>
  );
}
