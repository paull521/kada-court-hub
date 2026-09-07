import AppShell from "@/components/AppShell";
import ProfileFrame from "@/components/ProfileFrame";

export default function Loading() {
  return (
    <AppShell active="profile" contentClass="player-profile-content">
      <ProfileFrame />
    </AppShell>
  );
}
