import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainDashboardFrame from "@/components/CaptainDashboardFrame";

/**
 * The dashboard, without its numbers. Every captain route under this one has a
 * loading.tsx of its own, so this one is only ever the dashboard's.
 */
export default function Loading() {
  return (
    <CaptainShellFrame active="dashboard">
      <CaptainDashboardFrame />
    </CaptainShellFrame>
  );
}
