import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import HomeFrame from "@/components/HomeFrame";
import SeasonInvitationCard from "@/components/SeasonInvitationCard";
import { getPlayerPortalData } from "@/lib/kch-data";
import { createClient } from "@/lib/supabase/server";
import { emptyFeature } from "@/components/ui/shared-classes";

export default async function Home() {
  const data = await getPlayerPortalData("home");
  const supabase = await createClient();
  const { data: playerDocuments } = data.activeRegistrationId
    ? await supabase.rpc("get_player_document_packet", {
        p_invitation_id: null,
        p_registration_id: data.activeRegistrationId,
      })
    : { data: null };
  // Existing players who have not completed the current packet enter it as
  // soon as they return to Home. Pending invitations remain on Home until the
  // player chooses Join this season.
  if (!data.invitation && playerDocuments?.some((document: { response: string | null }) => !document.response))
    redirect(`/player-documents?registration=${data.activeRegistrationId}`);
  const firstName = data.profile.name.split(" ")[0];
  if (!data.contexts.length)
    return (
      <AppShell
        active="home"
        notifications={data.notifications}
        profileNeedsAttention={data.profileNeedsAttention}
        paymentNeedsAttention={data.paymentNeedsAttention}
        teamHasUnavailable={false}
      >
        <h1 className="title welcome">Hello, {firstName}!</h1>
        <p className="subtitle">Your KCH invitations appear here.</p>
        {data.invitation ? (
          <SeasonInvitationCard invitation={data.invitation} />
        ) : (
          <section className={`card ${emptyFeature}`}>
            <span>🏀</span>
            <div>
              <p className="eyebrow">KCH</p>
              <h2>No active team yet</h2>
              <p>When a conference invites you, the invitation will appear here.</p>
            </div>
          </section>
        )}
      </AppShell>
    );
  return (
    <AppShell
      contentClass="two-col"
      active="home"
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
    >
      {/* The same component app/home/loading.tsx draws while this read is in
          flight, so the wait is this page with its values missing rather than a
          screen of grey blocks that gives way to something else. */}
      <HomeFrame data={data} />
    </AppShell>
  );
}
