import AppShell from "@/components/AppShell";
import LegalDocument from "@/components/LegalDocument";
import { getPlayerPortalData } from "@/lib/kch-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ view }, data, roles] = await Promise.all([
    searchParams,
    getPlayerPortalData(),
    getAvailableRoles(),
  ]);
  const role =
    view === "owner" && roles.owner
      ? "owner"
      : view === "captain" && roles.captain
        ? "captain"
        : "player";
  return (
    <AppShell
      active="profile"
      notifications={data.notifications}
      contentClass="reading-content"
      role={role}
    >
      <p className="eyebrow">ACCOUNT</p>
      <h1 className="title">Privacy &amp; Terms</h1>
      <p className="subtitle">A readable summary for the KCH working MVP.</p>
      <LegalDocument />
    </AppShell>
  );
}
