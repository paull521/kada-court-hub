import AppShell from "@/components/AppShell";
import TeamFrame from "@/components/TeamFrame";

export default function Loading() {
  return (
    <AppShell contentClass="player-workspace-content" active="team">
      <TeamFrame />
    </AppShell>
  );
}
