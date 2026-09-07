import AppShell from "@/components/AppShell";
import LegalDocument from "@/components/LegalDocument";

/**
 * The whole page, because the whole page is fixed text. Nothing here was ever
 * waiting on the portal read except the bell and the nav badges, and those
 * stream into a shell that is already drawn.
 */
export default function Loading() {
  return (
    <AppShell active="profile" contentClass="reading-content">
      <p className="eyebrow">ACCOUNT</p>
      <h1 className="title">Privacy &amp; Terms</h1>
      <p className="subtitle">A readable summary for the KCH working MVP.</p>
      <LegalDocument />
    </AppShell>
  );
}
