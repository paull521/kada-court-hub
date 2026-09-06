import AppShell from "@/components/AppShell";
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
      <section className="card legal-card">
        <h2>Your KCH profile</h2>
        <p>
          KadaCourtHub stores the information needed to identify your account, place you on team
          rosters, show schedules, and track conference fees and payments.
        </p>
        <h2>Who can see information</h2>
        <p>
          Players see their own profile and team information. Captains receive limited access for
          their team. Conference owners can manage information within their conference. Access is
          restricted by account and conference role.
        </p>
        <h2>Payments</h2>
        <p>
          Zelle and cash entries are payment notices until the conference owner confirms receipt.
          KCH preserves payment and review history for conference records.
        </p>
        <h2>Player responsibilities</h2>
        <p>
          Keep your profile accurate, protect your login, use respectful team communication, and
          report incorrect roster, schedule, or payment information to your conference owner.
        </p>
        <h2>Historical records</h2>
        <p>
          Completed or canceled seasons are preserved rather than deleted so rosters, games,
          payments, and administrative history remain accurate.
        </p>
        <p className="legal-note">
          This is the working MVP summary and should receive formal legal review before public
          launch.
        </p>
      </section>
    </AppShell>
  );
}
