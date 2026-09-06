import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OwnerUniformManagement } from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import { OwnerContentPlaceholder } from "@/components/Skeleton";
import { getOwnerConferenceContext, getOwnerPortalData } from "@/lib/owner-data";

export default async function OwnerUniformsPage() {
  const context = await getOwnerConferenceContext();
  if (!context.authorized) redirect("/owner");
  return (
    <OwnerPageShell
      title="Uniforms"
      subtitle="Dark and light reference photos, organized by season."
      active="more"
      conferenceId={context.conferenceId}
      conferences={context.conferences}
    >
      <Suspense fallback={<OwnerContentPlaceholder />}>
        <UniformContent />
      </Suspense>
    </OwnerPageShell>
  );
}

async function UniformContent() {
  const data = await getOwnerPortalData();
  return <OwnerUniformManagement seasons={data.seasons} />;
}
