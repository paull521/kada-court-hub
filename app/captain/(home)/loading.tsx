import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainDashboardFrame from "@/components/CaptainDashboardFrame";

/**
 * The dashboard, without its numbers.
 *
 * It lives in a (home) route group so that it covers /captain and nothing else.
 * A loading.tsx at app/captain/ wraps that segment's whole children slot, so it
 * fired on the way to every route below it as well - press Teams and the
 * dashboard's tiles appeared first, then the team page's frame. The player
 * routes never had that problem because they are siblings with nothing above
 * them; the group makes these siblings too.
 */
export default function Loading() {
  return (
    <CaptainShellFrame active="dashboard">
      <CaptainDashboardFrame />
    </CaptainShellFrame>
  );
}
